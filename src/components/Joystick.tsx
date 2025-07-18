import React, { useRef, useState, useEffect, useCallback } from "react";
import "./Joystick.css";

interface JoystickProps {
  onMove: (direction: {
    x: number;
    y: number;
    distance: number;
    angle: number;
  }) => void;
  size?: number;
  maxDistance?: number;
}

interface Position {
  x: number;
  y: number;
}

const Joystick: React.FC<JoystickProps> = ({
  onMove,
  size = 120,
  maxDistance = 50,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState<Position>({ x: 0, y: 0 });
  const [joystickCenter, setJoystickCenter] = useState<Position>({
    x: 0,
    y: 0,
  });

  // 조이스틱 중심점 계산
  const updateJoystickCenter = useCallback(() => {
    if (joystickRef.current) {
      const rect = joystickRef.current.getBoundingClientRect();
      setJoystickCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  console.log("22");

  useEffect(() => {
    updateJoystickCenter();
    window.addEventListener("resize", updateJoystickCenter);
    return () => window.removeEventListener("resize", updateJoystickCenter);
  }, [updateJoystickCenter]);

  // 거리와 각도 계산
  const calculateDirection = useCallback(
    (x: number, y: number) => {
      const distance = Math.sqrt(x * x + y * y);
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(y, x);

      // 거리가 maxDistance를 넘지 않도록 조정
      const clampedX = clampedDistance * Math.cos(angle);
      const clampedY = clampedDistance * Math.sin(angle);

      return {
        x: clampedX / maxDistance, // -1 ~ 1로 정규화
        y: clampedY / maxDistance, // -1 ~ 1로 정규화
        distance: clampedDistance / maxDistance, // 0 ~ 1로 정규화
        angle: angle, // 라디안
        clampedPosition: { x: clampedX, y: clampedY },
      };
    },
    [maxDistance]
  );

  // 터치/마우스 이벤트 처리
  const handleStart = useCallback(() => {
    setIsDragging(true);
    updateJoystickCenter();
  }, [updateJoystickCenter]);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const deltaX = clientX - joystickCenter.x;
      const deltaY = clientY - joystickCenter.y;

      const direction = calculateDirection(deltaX, deltaY);

      setKnobPosition(direction.clampedPosition);
      onMove({
        x: direction.x,
        y: direction.y,
        distance: direction.distance,
        angle: direction.angle,
      });
    },
    [isDragging, joystickCenter, calculateDirection, onMove]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setKnobPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0, distance: 0, angle: 0 });
  }, [onMove]);

  // 마우스 이벤트
  const handleMouseDown = () => {
    handleStart();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // 터치 이벤트
  const handleTouchStart = () => {
    handleStart();
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault(); // 스크롤 방지
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // 글로벌 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return (
    <div
      ref={joystickRef}
      className={`joystick ${isDragging ? "active" : ""}`}
      style={
        {
          width: size,
          height: size,
          "--joystick-size": `${size}px`,
          "--max-distance": `${maxDistance}px`,
        } as React.CSSProperties
      }
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="joystick-base">
        <div className="joystick-ring" />
        <div
          ref={knobRef}
          className="joystick-knob"
          style={{
            transform: `translate(${knobPosition.x}px, ${knobPosition.y}px)`,
          }}
        />
      </div>
    </div>
  );
};

export default Joystick;
