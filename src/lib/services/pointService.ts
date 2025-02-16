// src/lib/services/pointService.ts
import { 
  collection, 
  doc, 
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  DocumentData,
  runTransaction 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class PointService {
  static async getPoints(userId: string): Promise<number> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      return userData.points || 0;
    } catch (error) {
      console.error('Error getting points:', error);
      throw error;
    }
  }

  static async getTransactionHistory(userId: string): Promise<DocumentData[]> {
    try {
      const transactionsRef = collection(db, 'pointTransactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  static async addPoints(
    userId: string,
    amount: number,
    type: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const transactionRef = collection(db, 'pointTransactions');

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const currentPoints = userDoc.data().points || 0;
        const newPoints = currentPoints + amount;

        if (newPoints < 0) {
          throw new Error('Insufficient points');
        }

        // 포인트 업데이트
        transaction.update(userRef, {
          points: newPoints,
          lastPointsUpdate: Timestamp.now()
        });

        // 트랜잭션 기록 생성
        const newTransactionRef = doc(transactionRef);
        transaction.set(newTransactionRef, {
          userId,
          type,
          amount,
          description,
          metadata,
          createdAt: Timestamp.now()
        });
      });
    } catch (error) {
      console.error('Error in point transaction:', error);
      throw error;
    }
  }
}