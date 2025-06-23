import React from 'react';

const TextStats = ({
  characterCount,
  wordCount,
  lineCount,
  paragraphCount,
}) => {
  return (
    <div className="editor-stats">
      <div className="stat-item">
        <span className="stat-label">字符</span>
        <span className="stat-value">{characterCount}</span>
      </div>
      <div className="stat-divider">•</div>
      <div className="stat-item">
        <span className="stat-label">单词</span>
        <span className="stat-value">{wordCount}</span>
      </div>
      <div className="stat-divider">•</div>
      <div className="stat-item">
        <span className="stat-label">行数</span>
        <span className="stat-value">{lineCount}</span>
      </div>
      <div className="stat-divider">•</div>
      <div className="stat-item">
        <span className="stat-label">段落</span>
        <span className="stat-value">{paragraphCount}</span>
      </div>
    </div>
  );
};

export default TextStats;
