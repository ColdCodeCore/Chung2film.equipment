import React,{ useMemo } from 'react';

export default function SpaceLightBalls () {
  const elapsed = useMemo(() => {
    if (typeof sessionStorage === 'undefined') return 0;
    let startTime = sessionStorage.getItem('lightBallsStartTime');
    if (!startTime) {
      startTime = Date.now().toString();
      sessionStorage.setItem('lightBallsStartTime', startTime);
    }
    return (Date.now() - parseInt(startTime, 10)) / 1000;
  }, []);

  const delayStyle = { animationDelay: `-${elapsed}s` };

  const cssKeyframes = `
    @keyframes moveX1 { 0% { transform: translateX(18vw); } 100% { transform: translateX(65vw); } }
    @keyframes moveY1 { 0% { transform: translateY(28vh); } 100% { transform: translateY(75vh); } }
    @keyframes moveX2 { 0% { transform: translateX(78vw); } 100% { transform: translateX(25vw); } }
    @keyframes moveY2 { 0% { transform: translateY(58vh); } 100% { transform: translateY(15vh); } }
    @keyframes moveX3 { 0% { transform: translateX(52vw); } 100% { transform: translateX(85vw); } }
    @keyframes moveY3 { 0% { transform: translateY(76vh); } 100% { transform: translateY(25vh); } }
    
    .track-x-1 { animation: moveX1 17s infinite alternate ease-in-out; position: absolute; top:0; left:0; }
    .track-y-1 { animation: moveY1 23s infinite alternate ease-in-out; }
    .track-x-2 { animation: moveX2 19s infinite alternate ease-in-out; position: absolute; top:0; left:0; }
    .track-y-2 { animation: moveY2 13s infinite alternate ease-in-out; }
    .track-x-3 { animation: moveX3 14s infinite alternate ease-in-out; position: absolute; top:0; left:0; }
    .track-y-3 { animation: moveY3 29s infinite alternate ease-in-out; }

    .ball-1 { width: 30px; height: 30px; }
    .ball-2 { width: 80px; height: 80px; }
    .ball-3 { width: 52px; height: 52px; }
    
    @media (max-width: 767px) {
      .ball-1 { width: 36px; height: 36px; } 
      .ball-2 { width: 60px; height: 60px; } 
      .track-x-3 { display: none; } 
      @keyframes moveX1 { 0% { transform: translateX(24vw); } 100% { transform: translateX(75vw); } }
      @keyframes moveY1 { 0% { transform: translateY(34vh); } 100% { transform: translateY(85vh); } }
      @keyframes moveX2 { 0% { transform: translateX(72vw); } 100% { transform: translateX(15vw); } }
      @keyframes moveY2 { 0% { transform: translateY(62vh); } 100% { transform: translateY(25vh); } }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssKeyframes }} />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="track-x-1" style={delayStyle}>
          <div className="track-y-1" style={delayStyle}>
            <div className="ball-1 space-light-ball flicker-1" style={delayStyle} />
          </div>
        </div>
        <div className="track-x-2" style={delayStyle}>
          <div className="track-y-2" style={delayStyle}>
            <div className="ball-2 space-light-ball flicker-2" style={delayStyle} />
          </div>
        </div>
        <div className="track-x-3" style={delayStyle}>
          <div className="track-y-3" style={delayStyle}>
            <div className="ball-3 space-light-ball flicker-3" style={delayStyle} />
          </div>
        </div>
      </div>
    </>
  );
};