// src/features/shop/pages/Shop.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  collection, addDoc, getDocs, query, orderBy, 
  doc, getDoc, updateDoc, Timestamp, arrayUnion, 
  where, increment, writeBatch, deleteDoc
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { getUserDocument } from '../../../utils/userUtils';
import '../styles/ShopStyles.css';

const Shop = ({ telegramUser, isAdmin, walletTab = false }) => {
  const [activeTab, setActiveTab] = useState(walletTab ? 'wallet' : 'shop');
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // 추가 상태 - 상품 추가 폼
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    stock: 0,
    isAvailable: true
  });
  
  const userId = telegramUser?.id?.toString() || '';
  
  // 상품 목록 가져오기 - useCallback으로 감싸기
  const fetchProducts = useCallback(async () => {
    try {
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(productsQuery);
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProducts(productsList);
    } catch (error) {
      console.error('상품 목록 가져오기 오류:', error);
    }
  }, []);
  
  // 사용자의 구매 내역 가져오기 - useCallback으로 감싸기
  const fetchPurchases = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('구매 내역 가져오기 시도:', userId);
      
      // 인덱스 생성 전 임시 해결책: 정렬 없이 쿼리 후 클라이언트에서 정렬
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(purchasesQuery);
      console.log('구매 내역 조회 결과:', querySnapshot.size);
      
      let purchasesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 클라이언트에서 정렬
      purchasesList = purchasesList.sort((a, b) => {
        // purchaseDate가 Timestamp 객체인지 확인
        if (a.purchaseDate && b.purchaseDate) {
          return b.purchaseDate.toDate() - a.purchaseDate.toDate();
        }
        return 0;
      });
      
      console.log('구매 내역 목록:', purchasesList);
      setPurchases(purchasesList);
    } catch (error) {
      console.error('구매 내역 가져오기 오류:', error);
    }
  }, [userId]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        // 사용자 정보 및 포인트 가져오기
        const userData = await getUserDocument(telegramUser);
        
        if (userData) {
          setUserPoints(userData.points || 0);
        }
        
        // 상품 목록 가져오기
        await fetchProducts();
        
        // 사용자의 구매 내역 가져오기
        await fetchPurchases();
      } catch (error) {
        console.error('데이터 가져오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, telegramUser, fetchProducts, fetchPurchases]);
  
  // 상품 선택 처리
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };
  
  // 모달 닫기
  const closeModal = () => {
    setSelectedProduct(null);
  };
  
  // 상품 구매 처리
  const handlePurchase = async (product) => {
    if (!userId || isPurchasing) return;
    
    if (userPoints < product.price) {
      alert('MOPI가 부족합니다.');
      return;
    }
    
    if (product.stock <= 0) {
      alert('품절된 상품입니다.');
      return;
    }
    
    const confirmPurchase = window.confirm(`${product.name}을(를) ${product.price} MOPI로 구매하시겠습니까?`);
    if (!confirmPurchase) return;
    
    setIsPurchasing(true);
    
    try {
      // 트랜잭션으로 처리하여 데이터 일관성 유지
      const batch = writeBatch(db);
      
      // 1. 상품 재고 감소
      const productRef = doc(db, 'products', product.id);
      
      // 재고 확인을 위해 최신 상품 정보 조회
      const freshProductSnap = await getDoc(productRef);
      const freshProduct = freshProductSnap.data();
      
      if (!freshProduct || freshProduct.stock <= 0) {
        alert('품절된 상품입니다.');
        setIsPurchasing(false);
        return;
      }
      
      // 재고 감소 및 판매 가능 여부 업데이트
      batch.update(productRef, {
        stock: increment(-1),
        isAvailable: freshProduct.stock > 1 // 재고가 1개라면 구매 후 품절 처리
      });
      
      // 2. 사용자 포인트 차감
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        points: increment(-product.price),
        updatedAt: Timestamp.now()
      });
      
      // 3. 구매 내역 생성
      const purchaseRef = doc(collection(db, 'purchases'));
      const purchaseData = {
        userId,
        productId: product.id,
        productName: product.name,
        price: product.price,
        purchaseDate: Timestamp.now(),
        userName: telegramUser?.username || telegramUser?.first_name || 'Unknown User'
      };
      
      batch.set(purchaseRef, purchaseData);
      
      // 4. 사용자 문서에 구매 내역 추가
      batch.update(userRef, {
        purchases: arrayUnion({
          productId: product.id,
          purchaseId: purchaseRef.id,
          purchaseDate: Timestamp.now()
        })
      });
      
      // 일괄 처리 실행
      await batch.commit();
      
      // 5. 화면 갱신 - 타이밍 문제 방지를 위해 지연 추가
      setUserPoints(prev => prev - product.price);
      
      // 약간의 지연 후 데이터 새로고침
      setTimeout(async () => {
        await fetchProducts(); // 상품 목록 새로고침
        await fetchPurchases(); // 구매 내역 새로고침
        
        alert(`${product.name}을(를) 성공적으로 구매했습니다!`);
        closeModal(); // 모달 닫기
      }, 500);
    } catch (error) {
      console.error('구매 처리 오류:', error);
      alert('구매 처리 중 오류가 발생했습니다.');
    } finally {
      setIsPurchasing(false);
    }
  };
  
  // 상품 추가 폼 입력 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) || 0 : value
    }));
  };
  
  // 상품 추가 처리
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('관리자만 상품을 추가할 수 있습니다.');
      return;
    }
    
    if (!newProduct.name || !newProduct.description || newProduct.price <= 0) {
      alert('상품명, 설명, 가격은 필수 입력 항목입니다.');
      return;
    }
    
    try {
      // Firestore에 상품 추가
      const productData = {
        ...newProduct,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId
      };
      
      await addDoc(collection(db, 'products'), productData);
      
      alert('상품이 성공적으로 추가되었습니다.');
      
      // 상품 목록 새로고침
      await fetchProducts();
      
      // 폼 초기화
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        stock: 0,
        isAvailable: true
      });
    } catch (error) {
      console.error('상품 추가 오류:', error);
      alert('상품 추가 중 오류가 발생했습니다.');
    }
  };

  // 상품 삭제 처리
  const handleDeleteProduct = async (productId) => {
    if (!isAdmin || !productId) return;
    
    const confirmDelete = window.confirm('정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (!confirmDelete) return;
    
    try {
      // 상품 문서 삭제
      await deleteDoc(doc(db, 'products', productId));
      
      alert('상품이 성공적으로 삭제되었습니다.');
      
      // 상품 목록 새로고침
      await fetchProducts();
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert('상품 삭제 중 오류가 발생했습니다.');
    }
  };
  
  if (loading) {
    return <div className="shop-loading">로딩 중...</div>;
  }
  
  return (
    <div className="shop-container">
      <h1 className="shop-title">CCGG SHOP</h1>
      
      {/* 탭 메뉴 */}
      <div className="shop-tabs">
        <button 
          className={`shop-tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          상점
        </button>
        <button 
          className={`shop-tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          내 지갑
        </button>
        {isAdmin && (
          <button 
            className={`shop-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            관리자
          </button>
        )}
      </div>
      
      {/* 선택된 탭 내용 */}
      {activeTab === 'shop' && (
        <ShopTab 
          products={products} 
          userPoints={userPoints}
          onProductSelect={handleProductSelect}
        />
      )}
      
      {activeTab === 'wallet' && (
        <WalletTab 
          userPoints={userPoints}
          purchases={purchases}
        />
      )}
      
      {activeTab === 'admin' && isAdmin && (
        <AdminTab 
          newProduct={newProduct}
          onInputChange={handleInputChange}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          products={products}
          fetchProducts={fetchProducts}
        />
      )}
      
      {/* 상품 상세 모달 */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal" onClick={e => e.stopPropagation()}>
            <div className="product-modal-header">
              <div className="product-modal-title">{selectedProduct.name}</div>
              <button className="product-modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="product-modal-body">
              {selectedProduct.imageUrl && (
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name} 
                  className="product-modal-img"
                />
              )}
              
              <div className="product-modal-price">
                <span className="product-price-icon">🪙</span>
                {selectedProduct.price} MOPI
              </div>
              
              <p className="product-modal-desc">{selectedProduct.description}</p>
              
              <p className="product-modal-stock">
                재고: {selectedProduct.stock > 0 ? `${selectedProduct.stock}개 남음` : '품절'}
              </p>
              
              <div className="product-modal-actions">
                <button 
                  className="product-modal-buy"
                  onClick={() => handlePurchase(selectedProduct)}
                  disabled={isPurchasing || userPoints < selectedProduct.price || selectedProduct.stock <= 0}
                >
                  {isPurchasing 
                    ? '처리 중...' 
                    : userPoints < selectedProduct.price 
                      ? 'MOPI 부족' 
                      : selectedProduct.stock <= 0 
                        ? '품절' 
                        : '구매하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 탭 컴포넌트들 정의
const ShopTab = ({ products, userPoints, onProductSelect }) => {
  // 판매 가능한 상품만 필터링
  const availableProducts = products.filter(product => product.isAvailable);
  
  return (
    <div>
      <div className="wallet-info">
        <div className="wallet-info-header">
          <span className="balance-title">내 MOPI</span>
          <span className="wallet-balance">
            <span className="wallet-balance-icon">🪙</span>
            {userPoints}
          </span>
        </div>
      </div>
      
      {availableProducts.length > 0 ? (
        <div className="product-grid">
          {availableProducts.map(product => (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => onProductSelect(product)}
            >
              <div className="product-image-container">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="product-image" 
                  />
                ) : (
                  <div className="product-placeholder">🖼️</div>
                )}
              </div>
              
              <div className="product-content">
                <div className="product-name">{product.name}</div>
                <div className="product-description">{product.description}</div>
                <div className="product-price">
                  <span className="product-price-icon">🪙</span>
                  {product.price}
                </div>
                
                <button 
                  className="product-button"
                  disabled={userPoints < product.price || product.stock <= 0}
                >
                  {userPoints < product.price 
                    ? 'MOPI 부족' 
                    : product.stock <= 0 
                      ? '품절' 
                      : '구매하기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-purchases">
          <p>현재 판매 중인 상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

const WalletTab = ({ userPoints, purchases }) => {
  return (
    <div>
      <div className="wallet-info">
        <div className="wallet-info-header">
          <span className="balance-title">내 MOPI</span>
          <span className="wallet-balance">
            <span className="wallet-balance-icon">🪙</span>
            {userPoints}
          </span>
        </div>
      </div>
      
      <h2 className="purchase-history-title">구매 내역</h2>
      
      {purchases && purchases.length > 0 ? (
        <div className="purchase-history">
          {purchases.map(purchase => (
            <div key={purchase.id} className="purchase-item">
              <div className="purchase-item-header">
                <span className="purchase-product-name">{purchase.productName}</span>
                <span className="purchase-date">
                  {purchase.purchaseDate && 
                    new Date(purchase.purchaseDate.toDate()).toLocaleDateString()}
                </span>
              </div>
              <div className="purchase-price">
                <span className="product-price-icon">🪙</span>
                {purchase.price} MOPI
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-purchases">
          <p>구매 내역이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

const AdminTab = ({ newProduct, onInputChange, onAddProduct, onDeleteProduct, products, fetchProducts }) => {
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  
  const handleEditProduct = (product) => {
    // 수정 모드 활성화
    setEditMode(true);
    setEditProductId(product.id);
    
    // 폼에 기존 상품 정보 설정
    onInputChange({
      target: { name: 'name', value: product.name }
    });
    onInputChange({
      target: { name: 'description', value: product.description }
    });
    onInputChange({
      target: { name: 'price', value: product.price }
    });
    onInputChange({
      target: { name: 'imageUrl', value: product.imageUrl }
    });
    onInputChange({
      target: { name: 'stock', value: product.stock }
    });
    onInputChange({
      target: { name: 'isAvailable', value: product.isAvailable }
    });
  };
  
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!editProductId) return;
    
    try {
      setLoadingAdmin(true);
      
      // 상품 정보 업데이트
      const productRef = doc(db, 'products', editProductId);
      await updateDoc(productRef, {
        ...newProduct,
        updatedAt: Timestamp.now()
      });
      
      alert('상품 정보가 업데이트되었습니다.');
      
      // 상품 목록 새로고침
      await fetchProducts();
      
      // 수정 모드 초기화
      setEditMode(false);
      setEditProductId(null);
      
      // 폼 초기화
      onInputChange({
        target: { name: 'name', value: '' }
      });
      onInputChange({
        target: { name: 'description', value: '' }
      });
      onInputChange({
        target: { name: 'price', value: 0 }
      });
      onInputChange({
        target: { name: 'imageUrl', value: '' }
      });
      onInputChange({
        target: { name: 'stock', value: 0 }
      });
      onInputChange({
        target: { name: 'isAvailable', value: true }
      });
    } catch (error) {
      console.error('상품 수정 오류:', error);
      alert('상품 정보 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoadingAdmin(false);
    }
  };
  
  const cancelEdit = () => {
    setEditMode(false);
    setEditProductId(null);
    
    // 폼 초기화
    onInputChange({
      target: { name: 'name', value: '' }
    });
    onInputChange({
      target: { name: 'description', value: '' }
    });
    onInputChange({
      target: { name: 'price', value: 0 }
    });
    onInputChange({
      target: { name: 'imageUrl', value: '' }
    });
    onInputChange({
      target: { name: 'stock', value: 0 }
    });
    onInputChange({
      target: { name: 'isAvailable', value: true }
    });
  };
  
  return (
    <div>
      <div className="admin-form-container">
        <h3 className="admin-form-title">
          {editMode ? '상품 수정' : '새 상품 등록'}
        </h3>
        
        <form onSubmit={editMode ? handleUpdateProduct : onAddProduct}>
          <div className="form-group">
            <label className="form-label">상품명</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={onInputChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">상품 설명</label>
            <textarea
              name="description"
              value={newProduct.description}
              onChange={onInputChange}
              className="form-textarea"
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label className="form-label">가격 (MOPI)</label>
            <input
              type="number"
              name="price"
              value={newProduct.price}
              onChange={onInputChange}
              className="form-input"
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">이미지 URL</label>
            <input
              type="url"
              name="imageUrl"
              value={newProduct.imageUrl}
              onChange={onInputChange}
              className="form-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">재고 수량</label>
            <input
              type="number"
              name="stock"
              value={newProduct.stock}
              onChange={onInputChange}
              className="form-input"
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">판매 가능 여부</label>
            <select
              name="isAvailable"
              value={newProduct.isAvailable}
              onChange={(e) => onInputChange({
                target: { name: 'isAvailable', value: e.target.value === 'true' }
              })}
              className="form-input"
            >
              <option value="true">판매 가능</option>
              <option value="false">판매 중지</option>
            </select>
          </div>
          
          {editMode ? (
            <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={cancelEdit}
                className="admin-cancel-button"
                style={{ flex: 1, backgroundColor: '#4a525e' }}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="admin-submit-button"
                disabled={loadingAdmin}
                style={{ flex: 1 }}
              >
                {loadingAdmin ? '처리 중...' : '수정하기'}
              </button>
            </div>
          ) : (
            <button 
              type="submit" 
              className="admin-submit-button"
              disabled={loadingAdmin}
            >
              {loadingAdmin ? '처리 중...' : '상품 등록'}
            </button>
          )}
        </form>
      </div>
      
      <h2 className="purchase-history-title">등록된 상품 관리</h2>
      {products.length > 0 ? (
        <div className="purchase-history">
          {products.map(product => (
            <div key={product.id} className="purchase-item">
              <div className="purchase-item-header">
                <span className="purchase-product-name">{product.name}</span>
                <div>
                  <button 
                    onClick={() => handleEditProduct(product)}
                    style={{ marginRight: '8px', background: 'none', border: 'none', color: '#40a7e3', cursor: 'pointer' }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => onDeleteProduct(product.id)}
                    style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="purchase-price">
                <span className="product-price-icon">🪙</span>
                {product.price} MOPI
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#a0a0a0' }}>
                재고: {product.stock}개 / 상태: {product.isAvailable ? '판매 중' : '판매 중지'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-purchases">
          <p>등록된 상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default Shop;