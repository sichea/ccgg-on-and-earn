// features/task/components/CategorySelector.js
import React from 'react';

const CategorySelector = ({ selectedCategory, onCategoryChange }) => {
  return (
    <div className="bg-[#232d42] rounded-lg p-3 shadow-md">
      <div className="text-gray-400 mb-2">카테고리</div>
      <div className="flex">
        <button
          className={`flex-1 py-2 px-4 rounded-md ${
            selectedCategory === 'CCGG' 
              ? 'bg-blue-600 text-white' 
              : 'bg-[#1c2333] text-gray-300'
          }`}
          onClick={() => onCategoryChange('CCGG')}
        >
          CCGG
        </button>
        <button
          className={`flex-1 py-2 px-4 ml-2 rounded-md ${
            selectedCategory === 'Partners' 
              ? 'bg-blue-600 text-white' 
              : 'bg-[#1c2333] text-gray-300'
          }`}
          onClick={() => onCategoryChange('Partners')}
        >
          Partners
        </button>
      </div>
    </div>
  );
};

export default CategorySelector;