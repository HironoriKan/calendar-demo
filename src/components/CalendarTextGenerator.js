import React, { useState, useEffect, useRef } from 'react';

// ビューポートの高さを取得するためのカスタムフック
const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      // モバイルブラウザでより正確な高さを取得
      const vh = window.innerHeight;
      setViewportHeight(vh);
      
      // CSS変数として設定（1vhの実際の値をピクセルで設定）
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    // 初期設定
    handleResize();

    window.addEventListener('resize', handleResize);
    
    // モバイルデバイスでのアドレスバーの表示/非表示に対応
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
    
    // スクロール時にも更新（モバイルブラウザのアドレスバー表示/非表示対応）
    window.addEventListener('scroll', () => {
      setTimeout(handleResize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, []);

  return viewportHeight;
};

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
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  
  // ブロック状態を日付ベースで保持するステート
  const [blockedDates, setBlockedDates] = useState(new Map());
  
  // カレンダーポップアップの表示状態
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  
  // ポップアップカレンダーの表示月
  const [popupMonth, setPopupMonth] = useState(new Date());
  
  const popupRef = useRef();
  
  // 現在時刻の位置を計算するための状態
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  
  // ビューポートの高さを取得
  const viewportHeight = useViewportHeight();
  
  // カレンダーグリッドの高さを計算
  const calculateGridHeight = () => {
    // ビューポートの高さの100%から固定部分の高さを引く
    const headerHeight = 60; // ヘッダー
    const navHeight = 50;    // カレンダーナビゲーション
    const dateHeaderHeight = 80; // 日付ヘッダー
    const textAreaHeight = 75; // テキストエリア
    const footerHeight = 80;  // フッター
    
    // 合計の固定高さ
    const fixedHeights = headerHeight + navHeight + dateHeaderHeight + textAreaHeight + footerHeight;
    
    // ビューポートの高さから固定部分を引いた値
    return Math.max(viewportHeight - fixedHeights, 200);
  };
  
  // グリッドの高さを計算
  const gridHeight = calculateGridHeight();
  
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
  
  // 初期ブロックの設定（水曜日の特定時間帯）- この関数は空にする
  useEffect(() => {
    // ブロック機能を無効化するため、何もしない
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
    // ブロック機能を無効化して常にfalseを返す
    return false;
  };
  
  // セルのタップ処理（シンプルな選択/解除）
  const handleCellClick = (dayIndex, timeIndex) => {
    // 長押し中は処理しない
    if (isLongPress) return;
    
    const date = weekDates[dayIndex];
    if (!date) return;

    const key = getDateTimeKey(date, timeIndex);
    const newSelectedDates = new Map(selectedDates);
    
    if (selectedDates.has(key)) {
      newSelectedDates.delete(key);
    } else {
      newSelectedDates.set(key, true);
    }
    
    // 選択状態を更新し、コールバックでテキスト生成を実行
    setSelectedDates(newSelectedDates, () => {
      generateText(newSelectedDates);
    });
  };
  
  // セルの長押し開始処理
  const handleCellMouseDown = (dayIndex, timeIndex) => {
    // 長押しタイマーを設定（500ms）
    const timer = setTimeout(() => {
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
      
      // 選択状態を更新し、即時にテキスト生成を実行
      setSelectedDates(newSelectedDates);
      generateText(newSelectedDates);
      
      setIsDragging(true);
      setDragOperation(newValue);
      setIsLongPress(true);
    }, 500);
    
    setLongPressTimer(timer);
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
      
      // 選択状態を更新し、即時にテキスト生成を実行
      setSelectedDates(newSelectedDates);
      generateText(newSelectedDates);
    }
  };
  
  // マウスアップ/タッチエンド処理
  const handleMouseUp = () => {
    // タイマーをクリア
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // ドラッグ状態をリセット
    if (isDragging) {
      setIsDragging(false);
      setDragOperation(null);
      
      // 長押し状態をリセット
      setTimeout(() => {
        setIsLongPress(false);
      }, 50); // 少し遅延させてクリックイベントとの競合を防ぐ
      
      // 選択後にテキストを生成
      generateText(selectedDates);
    }
  };
  
  // タッチ操作のためのイベントハンドラー
  const handleTouchMove = (e) => {
    // 長押し状態でなければスクロールを許可
    if (!isLongPress) return;
    
    // 長押しドラッグ中のみスクロールを防止
    if (isDragging) {
      // カレンダーグリッド内のタッチ移動のみ処理
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // カレンダーグリッド内のセルかどうかを確認
      if (element && element.dataset.dayIndex !== undefined && element.dataset.timeIndex !== undefined) {
        e.preventDefault(); // カレンダーグリッド内のみスクロールを防止
        
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
  const generateText = (dates = selectedDates) => {
    let text = '';
    
    // 日付ごとにグループ化
    const dateGroups = new Map();
    
    dates.forEach((_, key) => {
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
    <div className="flex justify-center bg-gray-50 w-full" style={{ minHeight: '100vh', minHeight: 'calc(var(--vh, 1vh) * 100)', overscrollBehavior: 'auto' }}>
      <div 
        className="flex flex-col bg-white w-full max-w-[400px] shadow-md" 
        style={{ height: '100vh', height: 'calc(var(--vh, 1vh) * 100)' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleMouseUp}
      >
        {/* ヘッダー - 固定高さ */}
        <div className="bg-white p-2 flex justify-center items-center shadow-sm">
          <div className="flex items-center">
            <div className="text-lg font-medium flex items-center">
              {/* SVGとして直接埋め込み */}
              <svg width="120" height="40" viewBox="0 0 1000 280" xmlns="http://www.w3.org/2000/svg">
                {/* ピンク色の棒グラフ要素 */}
                <rect x="22" y="70" width="40" height="160" rx="20" fill="#D08B8C"/>
                <rect x="115" y="30" width="40" height="200" rx="20" fill="#D08B8C"/>
                <rect x="262" y="70" width="40" height="160" rx="20" fill="#D08B8C"/>
                
                {/* 黄色の棒グラフ要素 */}
                <rect x="188" y="110" width="40" height="120" rx="20" fill="#E9B949"/>
                
                {/* MakeMeテキスト */}
                <path d="M414 70L450 180L486 70H530L570 180L606 70H652L588 230H542L502 120L462 230H416L352 70H414Z" fill="#666666"/>
                <path d="M670 230V70H716V190H796V230H670Z" fill="#666666"/>
                <path d="M830 230V70H876V140H936V70H982V230H936V180H876V230H830Z" fill="#666666"/>
                <path d="M1010 230V70H1056V190H1136V230H1010Z" fill="#666666"/>
                
                {/* メイクミークラウドテキスト */}
                <text x="500" y="270" font-family="'Noto Sans JP', sans-serif" font-size="36" text-anchor="middle" fill="#666666">メイクミークラウド</text>
              </svg>
              <span className="ml-2 font-bold text-gray-700">カレンダー日程調整</span>
            </div>
          </div>
        </div>
        
        {/* カレンダーナビゲーション - 固定高さ */}
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
        <div className="bg-white p-0 mb-0 flex-1 flex flex-col overflow-hidden min-h-0">
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
          
          {/* スクロール可能な本体部分 - 計算された高さを適用 */}
          <div 
            className="overflow-auto relative flex-1" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'auto'
            }}
          >
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
                      // ブロック状態のチェックを削除（常にfalse）
                      const isBlocked = false;
                      
                      return (
                        <td 
                          key={dayIndex} 
                          className={`relative p-0 border-l-[8px] border-r-[8px] border-white select-none cursor-pointer`}
                          onClick={() => handleCellClick(dayIndex, timeIndex)}
                          onMouseDown={() => handleCellMouseDown(dayIndex, timeIndex)}
                          onMouseEnter={() => isDragging && handleCellMouseEnter(dayIndex, timeIndex)}
                          onTouchStart={() => handleTouchMove(e)}
                          data-day-index={dayIndex}
                          data-time-index={timeIndex}
                        >
                          <div className="flex justify-center">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              getSelectedSlots()[dayIndex][timeIndex] ? 'bg-red-300' : 'bg-red-100'
                            }`}>
                              {/* ブロック表示を削除 */}
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
        
        {/* 下部固定エリア - 固定高さ */}
        <div className="bg-white border-t border-gray-200 flex flex-col">
          {/* 選択した時間テキスト表示 */}
          <div className="bg-white" style={{ height: '75px' }}>
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
          <div className="bg-white p-1 flex justify-center items-center border-t border-gray-200">
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
      </div>
    </div>
  );
};

export default CalendarTextGenerator; 