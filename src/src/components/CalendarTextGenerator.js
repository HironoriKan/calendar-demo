import React, { useState, useEffect, useRef } from 'react';

const CalendarTextGenerator = () => {
  // 曜日の配列
  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
  
  // 時間の配列 (8:00 から 22:00)
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 8}:00`);
  
  // 選択状態を日付ベースで保持するステート
  const [selectedDates, setSelectedDates] = useState(new Map());
  
  // 生成されたテキスト
  const [generatedText, setGeneratedText] = useState('');
  
  // 現在の日付情報
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  
  // 今日の日付ハイライト用
  const today = new Date();
  
  // ドラッグ選択のための状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragOperation, setDragOperation] = useState(null); // true: 選択, false: 解除
  
  // ブロック状態を日付ベースで保持するステート
  const [blockedDates, setBlockedDates] = useState(new Map());
  
  // カレンダーポップアップの表示状態
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  
  // ポップアップカレンダーの表示月
  const [popupMonth, setPopupMonth] = useState(new Date());
  
  const popupRef = useRef();
  
  // 現在時刻の位置を計算するための状態
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  
  // 週の開始日を計算
  useEffect(() => {
    const currentDay = new Date(currentDate);
    const day = currentDay.getDay(); // 0: 日曜日, 1: 月曜日, ...
    
    // 月曜日を週の開始日とする
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(currentDay);
    monday.setDate(currentDay.getDate() + mondayOffset);
    
    // 週の日付を計算
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    setWeekDates(dates);
  }, [currentDate]);
  
  // 初期ブロックの設定（水曜日の特定時間帯）
  useEffect(() => {
    // 初期ブロックの設定は一度だけ行う
    if (blockedDates.size === 0 && weekDates.length > 0) {
      const newBlockedDates = new Map();
      
      // 現在の週の水曜日を取得
      const wednesday = weekDates.find((date, index) => index === 2);
      
      if (wednesday) {
        // 10:00から14:00までをブロック
        for (let timeIndex = 2; timeIndex <= 6; timeIndex++) {
          const date = new Date(wednesday);
          date.setHours(timeIndex + 8, 0, 0, 0);
          newBlockedDates.set(date.toISOString(), true);
        }
        
        setBlockedDates(newBlockedDates);
      }
    }
  }, [weekDates, blockedDates.size]);
  
  // 前の週へ
  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  
  // 次の週へ
  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  
  // 今日へ移動
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // 日付と時間からキーを生成する関数
  const getDateTimeKey = (date, timeIndex) => {
    const d = new Date(date);
    d.setHours(timeIndex + 8, 0, 0, 0);
    return d.toISOString();
  };
  
  // 日付と時間からブロック状態を確認する関数
  const isDateTimeBlocked = (date, timeIndex) => {
    if (!date) return false;
    
    const key = getDateTimeKey(date, timeIndex);
    return blockedDates.has(key);
  };
  
  // セルのマウスダウン(ドラッグ開始)処理
  const handleCellMouseDown = (dayIndex, timeIndex) => {
    const date = weekDates[dayIndex];
    if (!date) return;

    const key = getDateTimeKey(date, timeIndex);
    const newSelectedDates = new Map(selectedDates);
    const newValue = !selectedDates.has(key);
    
    if (newValue) {
      newSelectedDates.set(key, true);
    } else {
      newSelectedDates.delete(key);
    }
    
    setSelectedDates(newSelectedDates);
    setIsDragging(true);
    setDragOperation(newValue);
  };
  
  // セルのマウスエンター(ドラッグ中)処理
  const handleCellMouseEnter = (dayIndex, timeIndex) => {
    if (isDragging && dragOperation !== null) {
      const date = weekDates[dayIndex];
      if (!date) return;

      const key = getDateTimeKey(date, timeIndex);
      const newSelectedDates = new Map(selectedDates);
      
      if (dragOperation) {
        newSelectedDates.set(key, true);
      } else {
        newSelectedDates.delete(key);
      }
      
      setSelectedDates(newSelectedDates);
    }
  };
  
  // マウスアップ(ドラッグ終了)処理
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOperation(null);
  };
  
  // タッチ操作のためのイベントハンドラー
  const handleTouchStart = (dayIndex, timeIndex) => {
    handleCellMouseDown(dayIndex, timeIndex);
  };
  
  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault(); // スクロールを防止
      
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // data属性からセルの位置情報を取得
      if (element && element.dataset.dayIndex !== undefined && element.dataset.timeIndex !== undefined) {
        const dayIndex = parseInt(element.dataset.dayIndex);
        const timeIndex = parseInt(element.dataset.timeIndex);
        handleCellMouseEnter(dayIndex, timeIndex);
      }
    }
  };
  
  const handleTouchEnd = () => {
    handleMouseUp();
  };
  
  // 選択をリセット
  const resetSelection = () => {
    setSelectedDates(new Map());
    setGeneratedText('');
  };
  
  // テキスト生成
  const generateText = () => {
    let text = '';
    
    // 日付ごとにグループ化
    const dateGroups = new Map();
    
    selectedDates.forEach((_, key) => {
      const date = new Date(key);
      const dateKey = date.toDateString();
      const hour = date.getHours();
      
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey).push(hour);
    });

    // 日付順にソート
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => new Date(a) - new Date(b));
    
    sortedDates.forEach(dateKey => {
      const date = new Date(dateKey);
      const hours = dateGroups.get(dateKey).sort((a, b) => a - b);
      
      if (hours.length > 0) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const jpWeekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        
        text += `${month}月${day}日(${jpWeekday}) `;
        
        // 連続した時間帯をまとめる
        let startHour = null;
        let endHour = null;
        
        hours.forEach(hour => {
          if (startHour === null) {
            startHour = hour;
            endHour = hour + 1;
          } else if (hour === endHour) {
            endHour = hour + 1;
          } else {
            text += `${startHour}:00-${endHour}:00 `;
            startHour = hour;
            endHour = hour + 1;
          }
        });
        
        if (startHour !== null) {
          text += `${startHour}:00-${endHour}:00 `;
        }
        
        text += '\n';
      }
    });
    
    setGeneratedText(text.trim());
  };
  
  // 選択状態からグリッド表示用のデータを生成
  const getSelectedSlots = () => {
    const slots = Array(7).fill().map(() => Array(14).fill(false));
    
    weekDates.forEach((date, dayIndex) => {
      if (!date) return;
      
      for (let timeIndex = 0; timeIndex < 14; timeIndex++) {
        const key = getDateTimeKey(date, timeIndex);
        if (selectedDates.has(key)) {
          slots[dayIndex][timeIndex] = true;
        }
      }
    });
    
    return slots;
  };
  
  // 選択状態が変更されたらテキストを更新
  useEffect(() => {
    generateText();
  }, [selectedDates, weekDates]);
  
  // テキストをクリップボードにコピー
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText)
      .then(() => {
        alert('テキストをコピーしました');
      })
      .catch(err => {
        console.error('コピーに失敗しました', err);
      });
  };
  
  // 選択した時間をLINEで送信する関数
  const sendToLine = () => {
    if (!generatedText) return;
    
    // LINEで送信するためのURLスキーム
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(generatedText)}`;
    
    // 新しいウィンドウでLINEを開く
    window.open(lineUrl, '_blank');
  };
  
  // コンポーネントのマウント/アンマウント時にイベントリスナーを設定/解除
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  // コンポーネントのマウント時にタッチイベントリスナーを設定
  useEffect(() => {
    const handleDocumentTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault(); // ドラッグ中のスクロールを防止
      }
    };
    
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', handleDocumentTouchMove);
    };
  }, [isDragging]);
  
  // ポップアップカレンダーの月を変更
  const changePopupMonth = (increment) => {
    const newDate = new Date(popupMonth);
    newDate.setMonth(popupMonth.getMonth() + increment);
    setPopupMonth(newDate);
  };
  
  // 日付を選択して週を変更
  const selectDate = (date) => {
    setCurrentDate(date);
    setShowCalendarPopup(false);
  };
  
  // 月の日数を取得
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // 月の最初の日の曜日を取得（0: 日曜日, 1: 月曜日, ...）
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // ポップアップ外をクリックしたときに閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowCalendarPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popupRef]);
  
  // カレンダーポップアップのレンダリング
  const renderCalendarPopup = () => {
    if (!showCalendarPopup) return null;
    
    const year = popupMonth.getFullYear();
    const month = popupMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // 日本語の曜日（日曜始まり）
    const jpWeekdays = ['日', '月', '火', '水', '木', '金', '土'];
    
    // カレンダーの日付配列を作成
    const calendarDays = [];
    
    // 前月の日を埋める
    const prevMonthDays = firstDay === 0 ? 6 : firstDay - 1;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = 0; i < prevMonthDays; i++) {
      calendarDays.push({
        day: daysInPrevMonth - prevMonthDays + i + 1,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false
      });
    }
    
    // 当月の日を埋める
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }
    
    // 翌月の日を埋める
    const nextDays = 42 - calendarDays.length; // 6週間分（42日）表示
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    
    for (let i = 1; i <= nextDays; i++) {
      calendarDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false
      });
    }
    
    return (
      <div ref={popupRef} className="absolute top-16 left-0 z-50 bg-white shadow-lg rounded-lg p-2 w-64">
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={() => changePopupMonth(-1)}
            className="p-1 text-gray-600"
          >
            &lt;
          </button>
          <div className="font-bold">
            {year}年{month + 1}月
          </div>
          <button 
            onClick={() => changePopupMonth(1)}
            className="p-1 text-gray-600"
          >
            &gt;
          </button>
          <button 
            onClick={() => setShowCalendarPopup(false)}
            className="p-1 text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {jpWeekdays.map((weekday, index) => (
            <div 
              key={`weekday-${index}`} 
              className={`text-center text-xs py-1 ${index === 0 ? 'text-red-500' : ''}`}
            >
              {weekday}
            </div>
          ))}
          
          {calendarDays.map((dateObj, index) => {
            const dateValue = new Date(dateObj.year, dateObj.month, dateObj.day);
            const isToday = 
              dateObj.day === today.getDate() && 
              dateObj.month === today.getMonth() && 
              dateObj.year === today.getFullYear();
            
            const isSelected = 
              weekDates.some(date => 
                date && 
                date.getDate() === dateObj.day && 
                date.getMonth() === dateObj.month && 
                date.getFullYear() === dateObj.year
              );
            
            return (
              <div 
                key={`day-${index}`}
                onClick={() => selectDate(dateValue)}
                className={`
                  text-center cursor-pointer w-8 h-8 flex items-center justify-center mx-auto
                  ${!dateObj.isCurrentMonth ? 'text-gray-400' : ''}
                  ${isToday ? 'bg-red-400 text-white rounded-full' : ''}
                  ${isSelected && !isToday ? 'bg-red-100 rounded-full' : ''}
                  hover:bg-gray-200 hover:rounded-full
                `}
              >
                {dateObj.day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 現在時刻の位置を計算
  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // 8:00から22:00の範囲内かチェック
      if (hours >= 8 && hours < 22) {
        // 5分単位で切り下げ
        const fiveMinuteInterval = Math.floor(minutes / 5);
        
        // セルの高さを計算
        // h-10(40px) + border-b-[8px]
        const cellHeight = 48; // 実際のレンダリングに合わせて調整
        
        // 時間の位置を計算（8時間目から開始）
        const hourPosition = (hours - 8) * cellHeight;
        
        // 5分単位の位置を計算（1時間を12分割）
        const minutePosition = (fiveMinuteInterval * 5 / 60) * cellHeight;
        
        setCurrentTimePosition(hourPosition + minutePosition);
      } else {
        // 表示範囲外の場合は非表示
        setCurrentTimePosition(-1);
      }
    };
    
    // 初回計算
    calculateTimePosition();
    
    // 1分ごとに更新
    const interval = setInterval(calculateTimePosition, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col bg-gray-200 w-full" style={{width: '400px', height: '850px'}} onTouchMove={handleTouchMove}>
      {/* ヘッダー */}
      <div className="bg-white p-2 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
          <div className="text-lg font-medium text-gray-500 flex items-center">
            <svg width="40" height="24" viewBox="0 0 40 24">
              <g>
                <rect x="2" y="4" width="4" height="16" rx="2" fill="#F087B3"/>
                <rect x="10" y="8" width="4" height="12" rx="2" fill="#FDAF69"/>
                <rect x="18" y="2" width="4" height="18" rx="2" fill="#85D2F0"/>
                <rect x="26" y="6" width="4" height="14" rx="2" fill="#9E9E9E"/>
              </g>
            </svg>
            <span className="ml-2 font-bold">カレンダー日程調整</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="p-1 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button className="p-1 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* カレンダーナビゲーション */}
      <div className="bg-white flex justify-between items-center p-2 border-b border-gray-200">
        <div className="flex items-center relative">
          <button 
            onClick={() => {
              setShowCalendarPopup(!showCalendarPopup);
              setPopupMonth(new Date(currentDate));
            }}
            className="flex items-center"
          >
            <span className="text-lg font-bold mr-1">{weekDates.length > 0 ? `${weekDates[0].getMonth() + 1}月` : ''}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {renderCalendarPopup()}
        </div>
        
        <div className="flex items-center justify-center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={previousWeek} className="px-2 text-gray-500 text-lg">&lt;</button>
          <button onClick={goToToday} className="px-2 text-gray-500 text-sm font-bold">今日</button>
          <button onClick={nextWeek} className="px-2 text-gray-500 text-lg">&gt;</button>
        </div>
        
        <div></div> {/* 右側のスペース確保用 */}
      </div>
      
      {/* カレンダーグリッド - ヘッダー固定、本体スクロール */}
      <div className="bg-white p-0 mb-0">
        {/* 固定ヘッダー部分 */}
        <table className="w-full border-collapse table-fixed" style={{ margin: '8px 0 4px 0' }}>
          <thead>
            <tr className="border-b-[8px] border-white">
              <th className="w-[50px] p-0"></th>
              {weekdays.map((weekday, index) => {
                const date = weekDates[index];
                const isToday = date && 
                  date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();
                
                return (
                  <th key={index} className="p-0 text-center border-l-[8px] border-r-[8px] border-white">
                    <div className="text-xs text-gray-500">{weekday}</div>
                    <div style={{ marginTop: '4px' }} className="flex justify-center">
                      <div className={`text-base font-bold w-10 h-10 flex items-center justify-center ${isToday ? 'bg-red-400 text-white rounded-full' : ''}`}>
                        {date ? date.getDate() : ''}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
        
        {/* スクロール可能な本体部分 */}
        <div className="overflow-auto relative" style={{ height: '500px' }}>
          {/* 現在時刻の線 */}
          {currentTimePosition >= 0 && (
            <>
              {/* 矢印の三角形 */}
              <div 
                className="absolute z-10 pointer-events-none" 
                style={{ 
                  top: `${currentTimePosition - 5}px`, 
                  left: '42px',
                  width: '0',
                  height: '0',
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderLeft: '8px solid rgba(255, 0, 0, 0.6)'
                }}
              />
              {/* 水平線 */}
              <div 
                className="absolute z-10 pointer-events-none" 
                style={{ 
                  top: `${currentTimePosition}px`, 
                  height: '0.5px', 
                  backgroundColor: 'rgba(255, 0, 0, 0.6)',
                  left: '50px',
                  right: '0'
                }}
              />
            </>
          )}
          
          <table className="w-full border-collapse table-fixed">
            <tbody>
              {timeSlots.map((time, timeIndex) => (
                <tr key={timeIndex} className="border-b-[8px] border-white">
                  <td className="w-[50px] p-0 text-xs text-gray-500 text-center align-middle">{time}</td>
                  {weekdays.map((_, dayIndex) => {
                    const date = weekDates[dayIndex];
                    const isBlocked = isDateTimeBlocked(date, timeIndex);
                    
                    return (
                      <td 
                        key={dayIndex} 
                        className={`relative p-0 border-l-[8px] border-r-[8px] border-white select-none
                          ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onMouseDown={isBlocked ? undefined : () => handleCellMouseDown(dayIndex, timeIndex)}
                        onMouseEnter={isBlocked ? undefined : () => handleCellMouseEnter(dayIndex, timeIndex)}
                        onTouchStart={isBlocked ? undefined : () => handleTouchStart(dayIndex, timeIndex)}
                        data-day-index={dayIndex}
                        data-time-index={timeIndex}
                      >
                        <div className="flex justify-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isBlocked ? 'bg-gray-300' : (
                              getSelectedSlots()[dayIndex][timeIndex] ? 'bg-red-300' : 'bg-red-100'
                            )
                          }`}>
                            {isBlocked && <div className="text-xs text-center">block</div>}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 選択した時間テキスト表示 - 高さを150pxに固定 */}
      <div className="bg-white border-t border-gray-200 mt-0" style={{ height: '150px' }}>
        <div 
          className="text-sm text-gray-800 h-full p-2 overflow-y-auto"
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => setGeneratedText(e.currentTarget.textContent)}
        >
          {generatedText ? (
            generatedText.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))
          ) : (
            <div className="text-gray-400">
              カレンダーで選択した日時が、自動で入力されます。
            </div>
          )}
        </div>
      </div>
      
      {/* フッターボタン */}
      <div className="bg-white p-1 flex justify-end items-center">
        <div className="flex space-x-3">
          <button 
            onClick={resetSelection}
            className="px-10 bg-gray-300 text-gray-700 rounded-full text-sm h-10 font-bold"
            style={{ margin: '20px 12px' }}
          >
            リセット
          </button>
          
          <button 
            onClick={copyToClipboard}
            className="px-10 bg-red-400 text-white rounded-full text-sm h-10 font-bold"
            style={{ margin: '20px 12px' }}
            disabled={!generatedText}
          >
            文字をコピー
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarTextGenerator; 