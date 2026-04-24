import { useState, useEffect } from 'react';
import { markMilestoneSeen } from '../utils/api';

const MilestoneCelebration = ({ milestone, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (milestone) {
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [milestone]);

  const handleClose = async () => {
    setIsClosing(true);
    
    try {
      // Mark milestone as seen
      await markMilestoneSeen(milestone.id);
    } catch (error) {
      console.error('Error marking milestone as seen:', error);
    }

    // Wait for exit animation
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!milestone) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
      isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
    }`}>
      {/* Confetti Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-bounce ${
              ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-red-400'][i % 6]
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Celebration Modal */}
      <div className={`relative max-w-md w-full transform transition-all duration-500 ${
        isVisible && !isClosing 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-75 opacity-0 translate-y-8'
      }`}>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
        
        {/* Main Card */}
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 text-center shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Sparkle Animation */}
          <div className="absolute top-4 right-4">
            <div className="w-6 h-6 text-yellow-400 animate-spin">
              ✨
            </div>
          </div>
          <div className="absolute top-8 left-6">
            <div className="w-4 h-4 text-pink-400 animate-bounce">
              ⭐
            </div>
          </div>
          <div className="absolute bottom-6 right-8">
            <div className="w-5 h-5 text-purple-400 animate-pulse">
              💫
            </div>
          </div>

          {/* Trophy Icon with Milestone Icon */}
          <div className="relative mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${milestone.color} text-white text-4xl shadow-lg transform animate-bounce`}>
              {milestone.icon}
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg animate-spin">
              🏆
            </div>
          </div>

          {/* Celebration Text */}
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-yellow-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Milestone Unlocked!
          </h2>
          
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            {milestone.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {milestone.description}
          </p>

          {/* Achievement Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-full text-yellow-800 dark:text-yellow-200 text-sm font-bold mb-6 border border-yellow-300 dark:border-yellow-700">
            <span className="text-lg">🎉</span>
            Achievement Earned
          </div>

          {/* Celebrate Button */}
          <button
            onClick={handleClose}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">🎊</span>
              Celebrate!
              <span className="text-lg">🎊</span>
            </span>
          </button>

          {/* Progress Indicator */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Unlocked on {new Date(milestone.unlocked_at || Date.now()).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCelebration;