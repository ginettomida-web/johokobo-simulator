document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------
    // 1. 定数とデータ定義 (?v=29)
    // --------------------------------------------------

    // 最大表示サイズを計算する関数 (スマホ・PCともに右上のコンパス・回転ボタンを含めて画面枠に収める)
    function getMaxCanvasSize() {
        if (window.innerWidth < 1024) {
            // スマホ表示時: 右側ボタンエリア(約70px)と左右余白を引いた最適な幅・高さを算出
            const availW = Math.max(240, window.innerWidth - 110);
            const availH = Math.max(240, window.innerHeight - 220);
            return Math.min(availW, availH, 440);
        }
        // PC表示時: 右上ツールバー含め画面全体にゆったり収まる800px上限
        const availW = Math.max(400, window.innerWidth - 500);
        const availH = Math.max(400, window.innerHeight - 180);
        return Math.min(availW, availH, 760);
    }

    // 部屋データ (実寸メートル & 備品上限)
    const ROOM_DATA = {
        room1: {
            name: '会議室1', width: 3.95, height: 6.3, bg: 'assets/rooms/room1.jpg',
            limits: { desk: 4, chair: 12, whiteboard: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 1.975, y: 0.8, angle: 180 },
                { type: 'desk', x: 1.975, y: 1.95, angle: 180 },   // 上：短辺
                { type: 'desk', x: 1.975, y: 4.35, angle: 0 },     // 下
                { type: 'desk', x: 1.375, y: 3.15, angle: 90 },    // 左：長辺
                { type: 'desk', x: 2.575, y: 3.15, angle: 270 }    // 右
            ]
        },
        room2: {
            name: '会議室2', width: 3.95, height: 6.3, bg: 'assets/rooms/room2.jpg',
            limits: { desk: 4, chair: 12, whiteboard: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 1.975, y: 5.5 },
                { type: 'desk', x: 1.975, y: 1.95, angle: 180 },
                { type: 'desk', x: 1.975, y: 4.35, angle: 0 },
                { type: 'desk', x: 1.375, y: 3.15, angle: 90 },
                { type: 'desk', x: 2.575, y: 3.15, angle: 270 }
            ]
        },
        room3: {
            name: '会議室3', width: 6.1, height: 12.55, bg: 'assets/rooms/room3.jpg',
            limits: { desk: 12, chair: 36, whiteboard: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 3.05, y: 11.8 },
                ...Array.from({ length: 6 }, (_, i) => [
                    { type: 'desk', x: 1.8, y: 2.5 + i * 1.5, angle: 180 },
                    { type: 'desk', x: 4.3, y: 2.5 + i * 1.5, angle: 180 }
                ]).flat()
            ]
        },
        room4: {
            name: '会議室4', width: 11.75, height: 15.6, bg: 'assets/rooms/room4.jpg',
            limits: { desk: 20, chair: 60, whiteboard: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 0.4, y: 4.0, angle: 90 },
                ...Array.from({ length: 5 }, (_, col) =>
                    Array.from({ length: 4 }, (_, row) => [
                        { type: 'desk', x: 2.2 + col * 1.8, y: 2.0 + row * 2.4, angle: 270 }
                    ]).flat()
                ).flat()
            ]
        },
        training: {
            name: '研修室', width: 5.5, height: 9.9, bg: 'assets/rooms/training.jpg',
            limits: { desk: 6, chair: 12, whiteboard: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 1.2, y: 1.2, angle: 135 },
                { type: 'desk', x: 4.35, y: 1.4, w: 2.3, h: 0.8, angle: 0, label: '操作卓', isSpecial: true, isFixed: true, isWhite: true },
                ...Array.from({ length: 3 }, (_, row) => [
                    { type: 'desk', x: 1.5, y: 2.8 + row * 1.5 },
                    { type: 'desk', x: 4.0, y: 2.8 + row * 1.5 }
                ]).flat()
            ]
        },
        multi: {
            name: '多目的研修室', width: 12.6, height: 15.6, bg: 'assets/rooms/multi.jpg',
            limits: { desk: 20, chair: 50, whiteboard: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 0.4, y: 5.5, angle: 90 },
                ...Array.from({ length: 5 }, (_, col) =>
                    Array.from({ length: 4 }, (_, row) => [
                        { type: 'desk', x: 2.2 + col * 1.8, y: 2.0 + row * 2.4, angle: 270 }
                    ]).flat()
                ).flat()
            ]
        },
        seminar: {
            name: 'セミナー室', width: 11.2, height: 11.2, bg: 'assets/rooms/seminar.jpg',
            limits: { desk: 20, chair: 80, whiteboard: 1, seminarLectern: 1 },
            initialLayout: [
                { type: 'whiteboard', x: 0.6, y: 1.2, angle: 90 },
                { type: 'seminarLectern', x: 1.975, y: 5.6, w: 1.2, h: 0.6, angle: 90, label: 'セミナー室演台', isSpecial: true },
                { type: 'desk', x: 1.8, y: 9.3, w: 3.4, h: 0.95, angle: 90, label: '操作卓', isSpecial: true, isFixed: true },
                ...Array.from({ length: 5 }, (_, col) =>
                    Array.from({ length: 4 }, (_, row) => [
                        { type: 'desk', x: 3.2 + col * 1.5, y: 2.0 + row * 2.4, angle: 270 }
                    ]).flat()
                ).flat()
            ]
        },
        swink: {
            name: 'スインクホール', width: 26.2, height: 20.55, bg: 'assets/rooms/swink.jpg',
            limits: { desk: 64, chair: 244, whiteboard: 1, swinkLectern: 1, swinkMcDesk: 1 },
            initialLayout: (function() {
                const layout = [
                    { type: 'desk', x: 7.8, y: 2.6, w: 1.6, h: 0.8, angle: 135, label: '操作卓', isSpecial: true }
                ];
                
                // 観覧席のブロック中心X座標に合わせる
                const leftCenterX = 5.12;
                const midCenterX = 13.1;
                const rightCenterX = 21.08;
                
                const chairPitchX = 0.5; // 椅子の横間隔
                const chairPitchY = 0.85; // 椅子の縦間隔（列ごとのスペースを大幅に確保）
                const startY = 7.6; // ステージから少し離した開始位置（前寄りに調整）

                for (let row = 0; row < 7; row++) {
                    const y = startY + row * chairPitchY;
                    const isBackRows = row >= 4; // 後ろの3列（行インデックス 4, 5, 6）
                    
                    // 左グループ
                    const leftCols = isBackRows ? 12 : 11;
                    const leftStartX = leftCenterX - ((leftCols - 1) * chairPitchX) / 2;
                    for (let col = 0; col < leftCols; col++) {
                        layout.push({ type: 'chair', x: leftStartX + col * chairPitchX, y: y, angle: 180 });
                    }
                    
                    // 中央グループ
                    const midCols = 12;
                    const midStartX = midCenterX - ((midCols - 1) * chairPitchX) / 2;
                    for (let col = 0; col < midCols; col++) {
                        layout.push({ type: 'chair', x: midStartX + col * chairPitchX, y: y, angle: 180 });
                    }
                    
                    // 右グループ
                    const rightCols = isBackRows ? 12 : 11;
                    const rightStartX = rightCenterX - ((rightCols - 1) * chairPitchX) / 2;
                    for (let col = 0; col < rightCols; col++) {
                        layout.push({ type: 'chair', x: rightStartX + col * chairPitchX, y: y, angle: 180 });
                    }
                }
                return layout;
            })()
        }
    };

    // 共用備品のデフォルト上限
    const SHARED_LIMITS = { lecternShared: 2, mcDesk: 2, screen: 2, monitor: 2 };

    // 部屋データに共用備品の上限を統合
    Object.keys(ROOM_DATA).forEach(key => {
        ROOM_DATA[key].limits = { ...ROOM_DATA[key].limits, ...SHARED_LIMITS };
    });

    // ドア位置の定義
    const DOOR_LOCATIONS = {
        room1: ['left-bottom'], room2: ['left-top'], room3: ['top-right'],
        room4: [{ pos: 'bottom-right', offset: 1.5 }], training: ['bottom-right'],
        multi: [{ pos: 'bottom-right', offset: 1.5 }], seminar: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        swink: ['bottom-left', 'bottom-right']
    };

    let currentRoomId = 'room1';
    let swinkSeatsActive = true;
    let SCALE = 100;
    let isUpdating = false; 
    let activeTimeouts = [];

    // レイアウトプリセット定義
    const LAYOUT_PRESETS = {
        room1: {
            'square': {
                name: 'ロの字型',
                items: ROOM_DATA.room1.initialLayout
            }
        },
        room2: {
            'square': {
                name: 'ロの字型',
                items: ROOM_DATA.room2.initialLayout
            }
        },
        room3: {
            'square': {
                name: 'ロの字型 (大型)',
                items: [
                    { type: 'whiteboard', x: 3.05, y: 11.8 }, // スクール型と同じ位置
                    // 上辺 (2台)
                    { type: 'desk', x: 2.15, y: 2.4, angle: 180 },
                    { type: 'desk', x: 3.95, y: 2.4, angle: 180 },
                    // 下辺 (2台)
                    { type: 'desk', x: 2.15, y: 10.2, angle: 0 },
                    { type: 'desk', x: 3.95, y: 10.2, angle: 0 },
                    // 左辺 (4台)
                    { type: 'desk', x: 1.25, y: 3.6, angle: 90 },
                    { type: 'desk', x: 1.25, y: 5.4, angle: 90 },
                    { type: 'desk', x: 1.25, y: 7.2, angle: 90 },
                    { type: 'desk', x: 1.25, y: 9.0, angle: 90 },
                    // 右辺 (4台)
                    { type: 'desk', x: 4.85, y: 3.6, angle: 270 },
                    { type: 'desk', x: 4.85, y: 5.4, angle: 270 },
                    { type: 'desk', x: 4.85, y: 7.2, angle: 270 },
                    { type: 'desk', x: 4.85, y: 9.0, angle: 270 }
                ]
            },
            'school': {
                name: 'スクール型 (標準)',
                items: ROOM_DATA.room3.initialLayout
            }
        },
        room4: {
            'square': {
                name: 'ロの字型 (20台)',
                items: [
                    { type: 'whiteboard', x: 0.4, y: 4.0, angle: 90 }, // 壁側に寄せ
                    // 上辺 (5台)
                    ...[2.275, 4.075, 5.875, 7.675, 9.475].map(x => ({ type: 'desk', x, y: 1.3, angle: 180 })),
                    // 下辺 (5台)
                    ...[2.275, 4.075, 5.875, 7.675, 9.475].map(x => ({ type: 'desk', x, y: 10.9, angle: 0 })),
                    // 左辺 (5台)
                    ...[2.5, 4.3, 6.1, 7.9, 9.7].map(y => ({ type: 'desk', x: 1.375, y, angle: 90 })),
                    // 右辺 (5台)
                    ...[2.5, 4.3, 6.1, 7.9, 9.7].map(y => ({ type: 'desk', x: 10.375, y, angle: 270 }))
                ]
            },
            'school': {
                name: 'スクール型 (標準)',
                items: ROOM_DATA.room4.initialLayout
            }
        },
        multi: {
            'square': {
                name: 'ロの字型 (20台)',
                items: [
                    { type: 'whiteboard', x: 0.4, y: 5.5, angle: 90 }, // 壁側に寄せ
                    // 上辺 (5台)
                    ...[2.7, 4.5, 6.3, 8.1, 9.9].map(x => ({ type: 'desk', x, y: 1.3, angle: 180 })),
                    // 下辺 (5台)
                    ...[2.7, 4.5, 6.3, 8.1, 9.9].map(x => ({ type: 'desk', x, y: 10.9, angle: 0 })),
                    // 左辺 (5台)
                    ...[2.5, 4.3, 6.1, 7.9, 9.7].map(y => ({ type: 'desk', x: 1.8, y, angle: 90 })),
                    // 右辺 (5台)
                    ...[2.5, 4.3, 6.1, 7.9, 9.7].map(y => ({ type: 'desk', x: 10.8, y, angle: 270 }))
                ]
            },
            'school': {
                name: 'スクール型 (標準)',
                items: ROOM_DATA.multi.initialLayout
            }
        },
        seminar: {
            'school': {
                name: 'スクール型 (標準)',
                items: [
                    { type: 'whiteboard', x: 0.6, y: 1.2, angle: 90 },
                    { type: 'seminarLectern', x: 1.975, y: 5.6, w: 1.2, h: 0.6, angle: 90, label: 'セミナー室演台', isSpecial: true },
                    { type: 'desk', x: 1.8, y: 9.3, w: 3.4, h: 0.95, angle: 90, label: '操作卓', isSpecial: true, isFixed: true },
                    ...Array.from({ length: 5 }, (_, col) =>
                        Array.from({ length: 4 }, (_, row) => [
                            { type: 'desk', x: 3.2 + col * 1.5, y: 2.0 + row * 2.4, angle: 270 }
                        ]).flat()
                    ).flat()
                ]
            },
            'empty': {
                name: '備品のみ (机なし)',
                items: [
                    { type: 'whiteboard', x: 0.6, y: 1.2, angle: 90 },
                    { type: 'seminarLectern', x: 1.975, y: 5.6, w: 1.2, h: 0.6, angle: 90, label: 'セミナー室演台', isSpecial: true },
                    { type: 'desk', x: 1.8, y: 9.3, w: 3.4, h: 0.95, angle: 90, label: '操作卓', isSpecial: true, isFixed: true }
                ]
            },
            'theater': {
                name: 'シアター形式 (椅子80席)',
                items: [
                    { type: 'whiteboard', x: 0.6, y: 1.2, angle: 90 },
                    { type: 'seminarLectern', x: 1.975, y: 5.6, w: 1.2, h: 0.6, angle: 90, label: 'セミナー室演台', isSpecial: true },
                    { type: 'desk', x: 1.8, y: 9.3, w: 3.4, h: 0.95, angle: 90, label: '操作卓', isSpecial: true, isFixed: true },
                    // 椅子 80脚 (8列 × 10行)
                    ...Array.from({ length: 8 }, (_, col) =>
                        Array.from({ length: 10 }, (_, row) => ({
                            type: 'chair', x: 4.8 + col * 0.75, y: 1.5 + row * 0.9, angle: 90
                        }))
                    ).flat()
                ]
            }
        },
        swink: {
            'empty': {
                name: '空 (観覧席収納・机椅子なし)',
                swinkSeatsActive: false,
                items: [
                    { type: 'desk', x: 7.8, y: 2.6, w: 1.6, h: 0.8, angle: 135, label: '操作卓', isSpecial: true }
                ]
            },
            'exam': {
                name: '試験・スクール形式 (机64台)',
                swinkSeatsActive: false,
                items: (function() {
                    const layout = [
                        { type: 'desk', x: 7.8, y: 2.6, w: 1.6, h: 0.8, angle: 135, label: '操作卓', isSpecial: true }
                    ];
                    // 縦8 × 横8 の机 (横向き・上向き: angle 0)
                    const startX = 4.0;
                    const pitchX = 2.6;
                    const startY = 7.6; // 全体を前（ステージ側）へ移動
                    const pitchY = 2.1;
                    for (let row = 0; row < 8; row++) {
                        for (let col = 0; col < 8; col++) {
                            layout.push({ type: 'desk', x: startX + col * pitchX, y: startY + row * pitchY, angle: 0 });
                        }
                    }
                    return layout;
                })()
            }
        }
    };

    // プリセット選択肢の更新
    function updatePatternSelect(roomId) {
        const select = document.getElementById('layoutPatternSelect');
        if (!select) return;

        // クリア
        select.innerHTML = '<option value="default">選択してください</option>';
        
        const presets = LAYOUT_PRESETS[roomId];
        if (presets) {
            Object.entries(presets).forEach(([id, data]) => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = data.name;
                select.appendChild(opt);
            });
        }
    }

    // プリセットの適用
    document.getElementById('applyPatternBtn')?.addEventListener('click', () => {
        const patternId = document.getElementById('layoutPatternSelect').value;
        if (patternId === 'default') {
            alert('パターンを選択してください。');
            return;
        }

        const preset = LAYOUT_PRESETS[currentRoomId]?.[patternId];
        if (!preset) return;

        if (canvas.getObjects().filter(o => o.furnitureType).length > 0) {
            if (!confirm('現在のレイアウトを消去して、プリセットを適用しますか？')) return;
        }

        // スインクホールの観覧席自動切り替えロジック
        if (currentRoomId === 'swink' && preset.swinkSeatsActive !== undefined) {
            if (swinkSeatsActive !== preset.swinkSeatsActive) {
                swinkSeatsActive = preset.swinkSeatsActive;
                const status = document.getElementById('swinkSeatsStatus');
                const dot = status?.querySelector('.dot');
                if (status && dot) {
                    if (swinkSeatsActive) {
                        status.classList.replace('bg-slate-300', 'bg-blue-600');
                        dot.classList.replace('left-1', 'left-6');
                    } else {
                        status.classList.replace('bg-blue-600', 'bg-slate-300');
                        dot.classList.replace('left-6', 'left-1');
                    }
                }
                
                // 一時的に initialLayout を preset に差し替えて描画をリセット
                const originalLayout = ROOM_DATA.swink.initialLayout;
                ROOM_DATA.swink.initialLayout = preset.items;
                updateRoom('swink');
                ROOM_DATA.swink.initialLayout = originalLayout;
                return; // updateRoom 内で配置されるのでここで終了
            }
        }

        // 家具のみを削除 (壁などは残す)
        const furniture = canvas.getObjects().filter(o => o.furnitureType);
        furniture.forEach(o => canvas.remove(o));

        isUpdating = true;
        preset.items.forEach((item, index) => {
            setTimeout(() => {
                addFurniture(item.type, {
                    left: item.x * SCALE,
                    top: item.y * SCALE,
                    angle: item.angle || 0,
                    w: item.w,
                    h: item.h,
                    label: item.label,
                    isSpecial: item.isSpecial,
                    isFixed: item.isFixed,
                    animate: false
                });
                if (index === preset.items.length - 1) {
                    isUpdating = false;
                    updateCapacityDisplay();
                }
            }, index * 20);
        });
    });

    // Fabric.js インスタンスの作成
    const canvas = new fabric.Canvas('layoutCanvas', {
        width: 800,
        height: 800,
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: '#f8fafc'
    });

    // カスタムコントロールの設定（選択時のハイライト色と枠線を明確に・サイズ変更を禁止ロック）
    fabric.Object.prototype.set({
        lockScalingX: true,
        lockScalingY: true,
        lockUniScaling: true,
        transparentCorners: false,
        cornerColor: '#2563eb',
        cornerStrokeColor: '#ffffff',
        borderColor: '#2563eb',
        cornerSize: 10,
        padding: 4,
        cornerStyle: 'circle',
        borderDashArray: null, // 点線を実線に変更してハイライトを明確化
        borderScaleFactor: 2.5,
        selectionBackgroundColor: 'rgba(37, 99, 235, 0.15)' // 選択オブジェクトの背景ハイライト
    });

    // 単一選択・複数選択問わず拡大縮小（サイズ変更）を完全不可に固定
    const enforceSizeLock = (e) => {
        const target = e.target;
        if (target) {
            target.set({
                lockScalingX: true,
                lockScalingY: true,
                lockUniScaling: true
            });
            target.setControlsVisibility({
                tl: false, tr: false, bl: false, br: false,
                ml: false, mt: false, mr: false, mb: false,
                mtr: true
            });
        }
    };
    canvas.on('selection:created', enforceSizeLock);
    canvas.on('selection:updated', enforceSizeLock);

    // --------------------------------------------------
    // Undo (一手戻る) & 複数選択モード & ズーム状態
    // --------------------------------------------------
    let historyStack = [];
    let isUndoRedoOperation = false;
    let isMultiSelectMode = false;
    let currentZoomScale = 1.0;

    function saveState() {
        if (isUndoRedoOperation || isUpdating) return;
        const json = canvas.toJSON([
            'furnitureType', 'label', 'isSpecial', 'isFixed', 'w', 'h',
            'selectable', 'evented', 'hasControls', 'lockMovementX', 'lockMovementY'
        ]);
        historyStack.push(JSON.stringify(json));
        if (historyStack.length > 30) {
            historyStack.shift(); // 最大30件
        }
        updateUndoButtonState();
    }

    function updateUndoButtonState() {
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.disabled = historyStack.length <= 1;
        }
    }

    function undo() {
        if (historyStack.length <= 1) return;
        isUndoRedoOperation = true;
        historyStack.pop(); // 現在の状態を捨てる
        const previousState = historyStack[historyStack.length - 1];

        canvas.loadFromJSON(previousState, () => {
            canvas.renderAll();
            isUndoRedoOperation = false;
            updateCapacityDisplay();
            updateUndoButtonState();
        });
    }

    document.getElementById('undoBtn')?.addEventListener('click', undo);
    
    // Ctrl+Z ショートカット
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        }
    });

    // オブジェクトがキャンバスの壁を食み出さないよう厳密にクランプする関数（二重安全復元ガード付き）
    function clampObjectInsideWalls(obj) {
        if (!obj) return;
        const wallThick = 0.12 * SCALE;
        const roomAreaHeight = canvas.height - 50; // infoMargin

        const minX = wallThick;
        const minY = wallThick;
        const maxX = canvas.width - wallThick;
        const maxY = roomAreaHeight - wallThick;

        let bound = obj.getBoundingRect(true);

        let adjustLeft = 0;
        let adjustTop = 0;

        if (bound.left < minX) {
            adjustLeft = minX - bound.left;
        } else if (bound.left + bound.width > maxX) {
            adjustLeft = maxX - (bound.left + bound.width);
        }

        if (bound.top < minY) {
            adjustTop = minY - bound.top;
        } else if (bound.top + bound.height > maxY) {
            adjustTop = maxY - (bound.top + bound.height);
        }

        if (adjustLeft !== 0 || adjustTop !== 0) {
            obj.set({
                left: obj.left + adjustLeft,
                top: obj.top + adjustTop
            });
            obj.setCoords();

            // 調整後も食み出している場合は最後の安全座標へ絶対復元
            bound = obj.getBoundingRect(true);
            if (bound.left < minX - 0.5 || bound.left + bound.width > maxX + 0.5 || bound.top < minY - 0.5 || bound.top + bound.height > maxY + 0.5) {
                if (typeof obj.lastValidLeft === 'number' && typeof obj.lastValidTop === 'number') {
                    obj.set({ left: obj.lastValidLeft, top: obj.lastValidTop });
                    obj.setCoords();
                }
            }
        } else {
            // 壁の内側に完全に収まっている安全座標を更新
            obj.lastValidLeft = obj.left;
            obj.lastValidTop = obj.top;
        }
    }

    // オブジェクト移動時の壁当たり判定＆スナップ連動処理
    canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        // スナップ有効時の位置計算
        if (typeof isSnapEnabled !== 'undefined' && isSnapEnabled) {
            const SNAP_STEP_M = 0.1;
            const snapStep = SNAP_STEP_M * SCALE;
            obj.set({
                left: Math.round(obj.left / snapStep) * snapStep,
                top: Math.round(obj.top / snapStep) * snapStep
            });
        }

        // 壁の外側への食み出しを厳密にガード
        if (obj.furnitureType || obj.type === 'activeSelection' || obj.isSpecial) {
            clampObjectInsideWalls(obj);
        }
    });

    canvas.on('object:rotating', (e) => {
        if (e.target && (e.target.furnitureType || e.target.type === 'activeSelection' || e.target.isSpecial)) {
            clampObjectInsideWalls(e.target);
        }
    });

    // オブジェクト変更時に自動的に状態を保存＆最終壁内チェック
    canvas.on('object:added', () => { if (!isUpdating && !isUndoRedoOperation) saveState(); });
    canvas.on('object:modified', (e) => {
        if (e.target) clampObjectInsideWalls(e.target);
        if (!isUpdating && !isUndoRedoOperation) saveState();
    });
    canvas.on('object:removed', () => { if (!isUpdating && !isUndoRedoOperation) saveState(); });

    // 複数選択モード切替ボタン
    const multiSelectBtn = document.getElementById('multiSelectBtn');
    if (multiSelectBtn) {
        multiSelectBtn.addEventListener('click', () => {
            isMultiSelectMode = !isMultiSelectMode;
            if (isMultiSelectMode) {
                multiSelectBtn.classList.add('active-multi-select');
                multiSelectBtn.querySelector('span').textContent = '選択モード (ON)';
            } else {
                multiSelectBtn.classList.remove('active-multi-select');
                multiSelectBtn.querySelector('span').textContent = '選択モード';
            }
        });
    }

    // 複数選択モード有効時は Fabric.js の標準複数選択機能(Shiftキー挙動)を自動適用 (PC・スマホ完全対応)
    const injectShiftKey = (opt) => {
        if (isMultiSelectMode && opt && opt.e) {
            try {
                Object.defineProperty(opt.e, 'shiftKey', { get: () => true, configurable: true });
            } catch (err) {
                opt.e.shiftKey = true;
            }
        }
    };

    canvas.on('mouse:down:before', injectShiftKey);
    canvas.on('mouse:down', injectShiftKey);

    // --------------------------------------------------
    // 2. 部屋の切り替え機能
    // --------------------------------------------------

    function updateRoom(roomId) {
        // 既存のタイマーをすべてクリアして重複実行を防ぐ
        activeTimeouts.forEach(t => clearTimeout(t));
        activeTimeouts = [];

        // 共用備品のソートおよびスクリーン・モニター非表示制御
        const sharedContainer = document.querySelector('#sidebar button#addLecternSharedBtn')?.parentElement;
        const screenBtn = document.getElementById('addScreenBtn');
        const monitorBtn = document.getElementById('addMonitorBtn');
        const seminarLecternBtn = document.getElementById('addSeminarLecternBtn');
        const swinkLecternBtn = document.getElementById('addSwinkLecternBtn');
        const swinkMcDeskBtn = document.getElementById('addSwinkMcDeskBtn');

        // 一旦すべての専用備品ボタンを非表示に完全リセット
        if (seminarLecternBtn) seminarLecternBtn.style.display = 'none';
        if (swinkLecternBtn) swinkLecternBtn.style.display = 'none';
        if (swinkMcDeskBtn) swinkMcDeskBtn.style.display = 'none';

        if (roomId === 'swink' || roomId === 'seminar') {
            // スインクホール・セミナー室の場合はスクリーンとモニターを非表示
            if (screenBtn) screenBtn.style.display = 'none';
            if (monitorBtn) monitorBtn.style.display = 'none';

            // 専用備品を共用備品エリアの最上部に移動して表示
            if (roomId === 'seminar' && seminarLecternBtn && sharedContainer) {
                seminarLecternBtn.style.display = 'flex';
                sharedContainer.prepend(seminarLecternBtn);
            }
            if (roomId === 'swink' && sharedContainer) {
                if (swinkMcDeskBtn) {
                    swinkMcDeskBtn.style.display = 'flex';
                    sharedContainer.prepend(swinkMcDeskBtn);
                }
                if (swinkLecternBtn) {
                    swinkLecternBtn.style.display = 'flex';
                    sharedContainer.prepend(swinkLecternBtn);
                }
            }
        } else {
            // 通常の部屋の場合はスクリーン・モニターを表示
            if (screenBtn) screenBtn.style.display = 'flex';
            if (monitorBtn) monitorBtn.style.display = 'flex';
        }

        const room = ROOM_DATA[roomId];
        if (!room) return;

        isUpdating = true; // 更新開始
        currentRoomId = roomId;

        // プリセット選択肢の更新
        updatePatternSelect(roomId);

        // 壁の厚み(0.12m x 2 = 0.24m)をキャンバスサイズに加算し、
        // ROOM_DATAの寸法が「壁の内側の有効寸法（黒色部分まで）」になるよう調整
        const wallThickMeters = 0.12;
        const totalThick = wallThickMeters * 2;

        // スインクホールの20.55mは「ステージを除外した純粋な平土間」なので、
        // 計算上のキャンバス高さにはステージの奥行き(4.3m)を足す
        let calcHeight = room.height;
        if (roomId === 'swink') {
            calcHeight += 4.3;
        }

        const maxDisplaySize = getMaxCanvasSize();
        const ratioW = maxDisplaySize / (room.width + totalThick);
        const ratioH = maxDisplaySize / (calcHeight + totalThick);
        SCALE = Math.min(ratioW, ratioH);

        const newWidth = (room.width + totalThick) * SCALE;
        const infoMargin = 50; // ちょうど良いサイズだった50pxの余白
        const newHeight = (calcHeight + totalThick) * SCALE + infoMargin;

        canvas.clear();
        canvas.setDimensions({ width: newWidth, height: newHeight });

        // 方位の更新
        updateCompass(roomId);

        const wrapper = document.querySelector('.canvas-wrapper');
        const scaleInner = document.getElementById('canvasScaleInner');
        if (wrapper) {
            wrapper.style.width = `${newWidth}px`;
            wrapper.style.height = `${newHeight}px`;
        }
        if (scaleInner) {
            scaleInner.style.width = `${newWidth}px`;
            scaleInner.style.height = `${newHeight}px`;
        }

        // 固有コントロールとラベルの表示制御
        const roomSpecControls = document.getElementById('roomSpecificControls');
        const swinkControls = document.getElementById('swinkControls');
        const chairTypeDesc = document.getElementById('chairTypeDesc');

        const isStacking = (roomId === 'swink' || roomId === 'seminar');
        if (chairTypeDesc) {
            chairTypeDesc.textContent = isStacking ? 'スタッキングチェア' : '移動式椅子 (キャスター付)';
        }

        if (roomId === 'swink') {
            roomSpecControls.classList.remove('hidden');
            swinkControls.classList.remove('hidden');
        } else {
            roomSpecControls.classList.add('hidden');
            swinkControls.classList.add('hidden');
        }

        // 背景のベース (部屋の外側)
        canvas.backgroundColor = '#f1f5f9'; 

        // 3. 壁の描画設定
        const wallThick = 0.12 * SCALE;
        const wallTopColor = '#334155'; 
        const wallSideColor = '#0f172a'; 
        
        // 有効な部屋部分の高さ
        const roomAreaHeight = newHeight - infoMargin;

        const createWall = (opts) => {
            // 断面（ベース）
            const side = new fabric.Rect({
                ...opts, fill: wallSideColor,
                selectable: false, evented: false,
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.25)', blur: 12, offsetX: 4, offsetY: 6 })
            });
            // 天面
            const top = new fabric.Rect({
                ...opts,
                left: opts.left + 1.5, top: opts.top + 1.5,
                width: Math.max(1, opts.width - 3), height: Math.max(1, opts.height - 3),
                fill: wallTopColor,
                stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1,
                selectable: false, evented: false
            });
            return [side, top];
        };

        // 4. 床の描画
        const floor = new fabric.Rect({
            left: wallThick, top: wallThick,
            width: room.width * SCALE, height: calcHeight * SCALE,
            fill: '#ffffff',
            selectable: false, evented: false,
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1) inset', blur: 10, offsetX: 0, offsetY: 0 })
        });
        canvas.add(floor);

        // 5. 寸法ラベルの追加 (部屋の枠外・下部中央に配置)
        const dimensionText = new fabric.Text(`部屋寸法: ${room.width.toFixed(2)}m × ${calcHeight.toFixed(2)}m (壁芯内寸)`, {
            left: newWidth / 2,
            top: roomAreaHeight + 30, // 少し上寄りに
            fontSize: 14,
            fontWeight: 'bold',
            fill: '#475569',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });
        canvas.add(dimensionText);

        // 外壁の配置 (roomAreaHeight を基準にする)
        const wallData = [
            { left: 0, top: 0, width: newWidth, height: wallThick }, // top
            { left: 0, top: roomAreaHeight - wallThick, width: newWidth, height: wallThick }, // bottom
            { left: 0, top: 0, width: wallThick, height: roomAreaHeight }, // left
            { left: newWidth - wallThick, top: 0, width: wallThick, height: roomAreaHeight } // right
        ];
        
        wallData.forEach(data => {
            createWall(data).forEach(w => canvas.add(w));
        });

        // 壁の装飾ライン（ハイライト）
        const innerWallHighlight = new fabric.Rect({
            left: wallThick / 2, top: wallThick / 2, width: newWidth - wallThick, height: newHeight - wallThick,
            fill: 'transparent', stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1,
            selectable: false, evented: false
        });
        canvas.add(innerWallHighlight);

        // 柱や倉庫などの特徴的な壁 (追加分)
        if (roomId === 'room4') {
            const whHeight = 4.0 * SCALE;
            const whWidth = 6.37 * SCALE;
            createWall({ left: 0, top: roomAreaHeight - whHeight, width: whWidth, height: wallThick }).forEach(w => canvas.add(w));
            createWall({ left: whWidth - wallThick, top: roomAreaHeight - whHeight, width: wallThick, height: whHeight }).forEach(w => canvas.add(w));
        }
        if (roomId === 'multi') {
            // 休憩スペースの区切り (縦4m x 横7.35m)
            const restHeight = 4.0 * SCALE;
            const restWidth = 7.35 * SCALE;
            // 横線
            canvas.add(new fabric.Rect({
                left: 0, top: roomAreaHeight - restHeight, width: restWidth, height: 2,
                fill: '#94a3b8', selectable: false, evented: false,
                strokeDashArray: [10, 5]
            }));
            // 縦線
            canvas.add(new fabric.Rect({
                left: restWidth, top: roomAreaHeight - restHeight, width: 2, height: restHeight,
                fill: '#94a3b8', selectable: false, evented: false,
                strokeDashArray: [10, 5]
            }));
            const label = new fabric.Text('休憩スペース', {
                left: restWidth / 2, top: roomAreaHeight - restHeight / 2,
                fontSize: 14, fill: '#94a3b8', originX: 'center', originY: 'center', selectable: false
            });
            canvas.add(label);
        }
        // 会議室1のカスタム壁は削除されました

        // スインクホールの構造 (精密なステージ再現: 壁に密着)
        if (roomId === 'swink') {
            const stageTotalDepth = 4.3 * SCALE;
            const apronWidth = 14.8 * SCALE; // 客席側の幅 (正面)
            const rearWidth = 11.0 * SCALE;  // 壁側の幅 (奥)
            const straightDepth = 1.6 * SCALE; // 正面から1.6mは直線
            const centerX = newWidth / 2;
            const stageTopY = wallThick; // 壁に密着
            const stageBottomY = stageTopY + stageTotalDepth;

            // 舞台本体 (壁から手前1.6m平行部分まで窄まる)
            const stagePoints = [
                { x: centerX - rearWidth / 2, y: stageTopY }, // 1. 壁・左
                { x: centerX + rearWidth / 2, y: stageTopY }, // 2. 壁・右
                { x: centerX + apronWidth / 2, y: stageBottomY - straightDepth }, // 3. 斜め開始・右
                { x: centerX + apronWidth / 2, y: stageBottomY }, // 4. 手前・右
                { x: centerX - apronWidth / 2, y: stageBottomY }, // 5. 手前・左
                { x: centerX - apronWidth / 2, y: stageBottomY - straightDepth }  // 6. 斜め開始・左
            ];

            canvas.add(new fabric.Polygon(stagePoints, {
                fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1, selectable: false, evented: false
            }));

            // 舞台袖 (ステージ形状に合わせた壁: 1.6mの直線区間には壁を表示しない)
            const wingL = new fabric.Polygon([
                { x: 0, y: stageTopY },
                { x: centerX - rearWidth / 2, y: stageTopY },
                { x: centerX - apronWidth / 2, y: stageBottomY - straightDepth },
                { x: 0, y: stageBottomY - straightDepth }
            ], { fill: '#334155', selectable: false, evented: false });

            const wingR = new fabric.Polygon([
                { x: newWidth, y: stageTopY },
                { x: centerX + rearWidth / 2, y: stageTopY },
                { x: centerX + apronWidth / 2, y: stageBottomY - straightDepth },
                { x: newWidth, y: stageBottomY - straightDepth }
            ], { fill: '#334155', selectable: false, evented: false });

            canvas.add(wingL);
            canvas.add(wingR);



            const stageLabel = new fabric.Text('ステージ', {
                left: centerX, top: stageTopY + (stageTotalDepth - straightDepth) / 2,
                fontSize: 24, fontWeight: 'bold', fill: '#94a3b8', originX: 'center', originY: 'center', selectable: false
            });
            canvas.add(stageLabel);
        }

        // スインクホールの移動観覧席 (8-10-8構成の208席)
        if (roomId === 'swink' && swinkSeatsActive) {
            const seatsHeight = 10.868 * SCALE;
            const swinkDoorSize = 2.1 * SCALE;
            const startY = roomAreaHeight - wallThick - seatsHeight;
            const seatsWidth = newWidth - (wallThick * 2) - (swinkDoorSize * 2);
            const startX = wallThick + swinkDoorSize;

            // 背景エリア (グレー基調で立体感のあるデザイン)
            canvas.add(new fabric.Rect({
                left: startX, top: startY, width: seatsWidth, height: seatsHeight,
                fill: '#e2e8f0', stroke: '#94a3b8', strokeWidth: 3, rx: 4, ry: 4,
                selectable: false, evented: false
            }));
            // 内側のエッジ（さらに立体感を出す）
            canvas.add(new fabric.Rect({
                left: startX + 3, top: startY + 3, width: seatsWidth - 6, height: seatsHeight - 6,
                fill: 'transparent', stroke: '#f8fafc', strokeWidth: 1.5, rx: 2, ry: 2,
                selectable: false, evented: false
            }));

            // 座席計算 (26席 + 2通路)
            const aisleCount = 2;
            const totalChairs = 26;
            const unitW = seatsWidth / (totalChairs + (aisleCount * 2)); // 通路を2席分として計算
            const chairW = unitW;
            const aisleW = unitW * 2;

            // 8行の段差と座席
            for (let i = 0; i < 8; i++) {
                const rowY = startY + (i * (seatsHeight / 8.5)) + (seatsHeight / 16);
                
                // 段差ライン (金属的な質感)
                canvas.add(new fabric.Rect({
                    left: startX + 2, top: rowY + 12, width: seatsWidth - 4, height: 1,
                    fill: '#334155', selectable: false, evented: false
                }));

                // 座席配置 (8 - 10 - 8)
                let currentX = startX + (seatsWidth - (totalChairs * chairW + aisleCount * aisleW)) / 2 + (chairW / 2);
                const blockCounts = [8, 10, 8];
                
                blockCounts.forEach((count, bIdx) => {
                    for (let c = 0; c < count; c++) {
                        // 肘掛け (少し薄めの赤)
                        const arm = new fabric.Rect({
                            left: currentX, top: rowY, width: chairW - 2, height: 10, fill: '#b91c1c', rx: 2, ry: 2, originX: 'center', originY: 'center', selectable: false, evented: false
                        });
                        // 座面クッション (明るいソフトレッド)
                        const seat = new fabric.Rect({
                            left: currentX, top: rowY - 1, width: chairW - 6, height: 8, fill: '#f87171', rx: 3, ry: 3, originX: 'center', originY: 'center', selectable: false, evented: false
                        });
                        // 背もたれ (中間的な赤)
                        const back = new fabric.Rect({
                            left: currentX, top: rowY + 5, width: chairW - 2, height: 4, fill: '#ef4444', rx: 2, ry: 2, originX: 'center', originY: 'center', selectable: false, evented: false
                        });
                        // 質感ハイライト
                        const highlight = new fabric.Rect({
                            left: currentX, top: rowY - 2, width: chairW - 10, height: 2, fill: 'rgba(255,255,255,0.4)', rx: 1, ry: 1, originX: 'center', originY: 'center', selectable: false, evented: false
                        });

                        canvas.add(arm, seat, back, highlight);
                        currentX += chairW;
                    }
                    if (bIdx < blockCounts.length - 1) currentX += aisleW;
                });
            }

            const seatsLabel = new fabric.Text('移動観覧席 (208席)', {
                left: newWidth / 2, top: roomAreaHeight - wallThick - 15,
                fontSize: 16, fontWeight: 'bold', fill: '#475569', originX: 'center', selectable: false
            });
            canvas.add(seatsLabel);
        }

        // 4. ドアの描画（建築図面風：90度開いた状態＋開閉アーク）
        const doorSizeMap = {
            room1: 1.2, room2: 1.2, room3: 1.8, room4: 1.8,
            training: 1.76, multi: 1.8, seminar: 2.1, swink: 2.1
        };
        const doorSize = (doorSizeMap[roomId] || 1.0) * SCALE;
        const doors = DOOR_LOCATIONS[roomId] || [];

        // 開いた扉パネルを作るヘルパー（horizontal=壁に沿う向き, vertical=部屋内へ90度開いた向き）
        const makeOpenPanel = (x, y, size, orientation, hingeX, hingeY) => {
            const isVertical = orientation === 'vertical';
            return new fabric.Rect({
                left: x, top: y,
                width: isVertical ? 2 : size,
                height: isVertical ? size : 2,
                fill: '#94a3b8',
                selectable: false,
                evented: false,
                originX: hingeX,
                originY: hingeY
            });
        };

        const makeDoorArc = (path, x, y, hingeX, hingeY) => new fabric.Path(path, {
            left: x, top: y,
            fill: 'transparent',
            stroke: '#cbd5e1',
            strokeWidth: 1.5,
            selectable: false,
            evented: false,
            strokeDashArray: [4, 2],
            originX: hingeX,
            originY: hingeY
        });

        const makeWallGap = (gapLeft, gapTop, gapWidth, gapHeight) =>
            new fabric.Rect({ left: gapLeft, top: gapTop, width: gapWidth, height: gapHeight, fill: '#ffffff', selectable: false, evented: false });

        doors.forEach(doorData => {
            const pos = typeof doorData === 'string' ? doorData : doorData.pos;
            const offset = (typeof doorData === 'object' && doorData.offset ? doorData.offset : 0) * SCALE;
            const isDoubleDoor = (roomId === 'seminar' || roomId === 'swink');

            if (isDoubleDoor) {
                // 観音開き：両扉が通路側へ90度開いた状態
                const halfDoor = doorSize / 2;
                let x, y, gapLeft, gapTop, gapWidth, gapHeight;

                if (pos.startsWith('top')) {
                    x = (pos === 'top-left') ? wallThick + offset : newWidth - wallThick - doorSize - offset;
                    y = wallThick;
                    gapLeft = x; gapTop = -1; gapWidth = doorSize; gapHeight = wallThick + 2;

                    // 通路側（北）へ開く：左扉は西端ヒンジ、右扉は東端ヒンジ
                    const leftArc = makeDoorArc(`M ${halfDoor} 0 A ${halfDoor} ${halfDoor} 0 0 0 0 -${halfDoor}`, x, y, 'left', 'bottom');
                    const leftPanel = makeOpenPanel(x, y, halfDoor, 'vertical', 'left', 'bottom');
                    const rightArc = makeDoorArc(`M -${halfDoor} 0 A ${halfDoor} ${halfDoor} 0 0 1 0 -${halfDoor}`, x + doorSize, y, 'right', 'bottom');
                    const rightPanel = makeOpenPanel(x + doorSize, y, halfDoor, 'vertical', 'right', 'bottom');

                    canvas.add(makeWallGap(gapLeft, gapTop, gapWidth, gapHeight));
                    canvas.add(leftArc, leftPanel, rightArc, rightPanel);
                } else if (pos.startsWith('bottom')) {
                    x = (pos === 'bottom-left') ? wallThick + offset : newWidth - wallThick - doorSize - offset;
                    y = roomAreaHeight - wallThick;
                    gapLeft = x; gapTop = roomAreaHeight - wallThick - 1; gapWidth = doorSize; gapHeight = wallThick + 2;

                    // 通路側（南）へ開く
                    const leftArc = makeDoorArc(`M ${halfDoor} 0 A ${halfDoor} ${halfDoor} 0 0 1 0 ${halfDoor}`, x, y, 'left', 'top');
                    const leftPanel = makeOpenPanel(x, y, halfDoor, 'vertical', 'left', 'top');
                    const rightArc = makeDoorArc(`M -${halfDoor} 0 A ${halfDoor} ${halfDoor} 0 0 0 0 ${halfDoor}`, x + doorSize, y, 'right', 'top');
                    const rightPanel = makeOpenPanel(x + doorSize, y, halfDoor, 'vertical', 'right', 'top');

                    canvas.add(makeWallGap(gapLeft, gapTop, gapWidth, gapHeight));
                    canvas.add(leftArc, leftPanel, rightArc, rightPanel);
                }
            } else {
                // 片開きドア
                let x, y, doorArc, doorPanel, gapLeft, gapTop, gapWidth, gapHeight;

                if (pos === 'left-top') {
                    // 会議室2：西壁・上段。北端ヒンジで東（右）へ開く
                    x = wallThick; y = wallThick + offset;
                    gapLeft = -1; gapTop = y; gapWidth = wallThick + 2; gapHeight = doorSize;
                    doorArc = makeDoorArc(`M ${doorSize} 0 A ${doorSize} ${doorSize} 0 0 1 0 ${doorSize}`, x, y, 'left', 'top');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'horizontal', 'left', 'top');
                }
                else if (pos === 'left-bottom' && roomId === 'room1') {
                    // 会議室1：西壁・下段。南端ヒンジで東（右）へ開く
                    x = wallThick; y = roomAreaHeight - wallThick - offset;
                    gapLeft = -1; gapTop = roomAreaHeight - wallThick - doorSize - offset; gapWidth = wallThick + 2; gapHeight = doorSize;
                    doorArc = makeDoorArc(`M ${doorSize} 0 A ${doorSize} ${doorSize} 0 0 0 0 -${doorSize}`, x, y, 'left', 'bottom');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'horizontal', 'left', 'bottom');
                }
                else if (roomId === 'room3' || pos === 'top-right') {
                    // 会議室3：北壁・東側（右寄り）。西端（左）ヒンジで南（下・部屋内）へ開く
                    x = newWidth - wallThick - doorSize - offset;
                    y = wallThick;
                    gapLeft = x; gapTop = -1; gapWidth = doorSize; gapHeight = wallThick + 2;
                    doorArc = makeDoorArc(`M ${doorSize} 0 A ${doorSize} ${doorSize} 0 0 1 0 ${doorSize}`, x, y, 'left', 'top');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'vertical', 'left', 'top');
                }
                else if (roomId === 'room4' || roomId === 'multi') {
                    // 会議室4・多目的研修室：南壁・東端ヒンジで北（上・部屋内）へ開く
                    x = newWidth - wallThick - offset;
                    y = roomAreaHeight - wallThick;
                    gapLeft = newWidth - wallThick - doorSize - offset; gapTop = roomAreaHeight - wallThick - 1; gapWidth = doorSize; gapHeight = wallThick + 2;
                    doorArc = makeDoorArc(`M -${doorSize} 0 A ${doorSize} ${doorSize} 0 0 1 0 -${doorSize}`, x, y, 'right', 'bottom');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'vertical', 'right', 'bottom');
                }
                else if (roomId === 'training') {
                    // 研修室：南壁・西端（左）ヒンジで北（上・部屋内）へ開く
                    x = newWidth - wallThick - doorSize - offset;
                    y = roomAreaHeight - wallThick;
                    gapLeft = x; gapTop = roomAreaHeight - wallThick - 1; gapWidth = doorSize; gapHeight = wallThick + 2;
                    doorArc = makeDoorArc(`M ${doorSize} 0 A ${doorSize} ${doorSize} 0 0 0 0 -${doorSize}`, x, y, 'left', 'bottom');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'vertical', 'left', 'bottom');
                }
                else if (pos === 'bottom-left') {
                    x = wallThick + offset; y = roomAreaHeight - wallThick;
                    gapLeft = x; gapTop = roomAreaHeight - wallThick - 1; gapWidth = doorSize; gapHeight = wallThick + 2;
                    doorArc = makeDoorArc(`M ${doorSize} 0 A ${doorSize} ${doorSize} 0 0 0 0 -${doorSize}`, x, y, 'left', 'bottom');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'vertical', 'left', 'bottom');
                } else if (pos === 'bottom-right') {
                    x = newWidth - wallThick - offset; y = roomAreaHeight - wallThick;
                    gapLeft = newWidth - wallThick - doorSize - offset; gapTop = roomAreaHeight - wallThick - 1; gapWidth = doorSize; gapHeight = wallThick + 2;
                    doorArc = makeDoorArc(`M -${doorSize} 0 A ${doorSize} ${doorSize} 0 0 1 0 -${doorSize}`, x, y, 'right', 'bottom');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'vertical', 'right', 'bottom');
                } else {
                    // その他（北壁・左寄りなど）
                    x = wallThick + offset; y = wallThick;
                    gapLeft = x; gapTop = -1; gapWidth = doorSize; gapHeight = wallThick + 2;
                    doorArc = makeDoorArc(`M ${doorSize} 0 A ${doorSize} ${doorSize} 0 0 1 0 ${doorSize}`, x, y, 'left', 'top');
                    doorPanel = makeOpenPanel(x, y, doorSize, 'vertical', 'left', 'top');
                }

                canvas.add(makeWallGap(gapLeft, gapTop, gapWidth, gapHeight));
                canvas.add(doorArc, doorPanel);
            }
        });
        


        // グリッド
        const gridOverlay = document.querySelector('#canvasContainer .absolute');
        if (gridOverlay) {
            gridOverlay.style.backgroundSize = `${SCALE}px ${SCALE}px`;
        }
        
        // 5. 初期レイアウト（アニメーション付き）
        if (room.initialLayout) {
            room.initialLayout.forEach((item, index) => {
                const timeoutId = setTimeout(() => {
                    addFurniture(item.type, {
                        left: item.x * SCALE,
                        top: item.y * SCALE,
                        angle: item.angle || 0,
                        w: item.w,
                        h: item.h,
                        label: item.label,
                        isSpecial: item.isSpecial,
                        isFixed: item.isFixed,
                        isInitial: true,
                        animate: false // アニメーションをオフにして確実に表示
                    });
                    
                    if (index === room.initialLayout.length - 1) {
                        isUpdating = false;
                        updateCapacityDisplay();
                        canvas.requestRenderAll();
                        historyStack = [];
                        saveState();
                    }
                }, index * 10);
                activeTimeouts.push(timeoutId);
            });
        } else {
            isUpdating = false;
            updateCapacityDisplay();
            historyStack = [];
            saveState();
        }

        canvas.requestRenderAll();
    }

    // キャパシティ表示 & 備品リストの更新 (集計機能統合版)
    function updateCapacityDisplay() {
        if (isUpdating) return;

        const room = ROOM_DATA[currentRoomId];
        if (!room || !room.limits) return;

        const counts = {
            desk: 0, chair: 0, whiteboard: 0,
            lecternShared: 0, mcDesk: 0, screen: 0, monitor: 0,
            seminarLectern: 0, swinkLectern: 0, swinkMcDesk: 0
        };

        const summary = {};

        canvas.getObjects().forEach(obj => {
            if (obj.furnitureType) {
                // 特殊備品(演台等)は基本カウント(机)から除外するロジックを維持
                if (obj.furnitureType === 'desk' && obj.isSpecial) {
                    // skip basic count for desk limit
                } else {
                    if (counts.hasOwnProperty(obj.furnitureType)) {
                        counts[obj.furnitureType]++;
                    }
                }
                
                // 集計用ラベル決定
                let label = obj.label || '';
                if (!label) {
                    if (obj.furnitureType === 'desk') label = 'テーブル (1800×600)';
                    else if (obj.furnitureType === 'chair') label = '椅子';
                    else if (obj.furnitureType === 'whiteboard') label = 'ホワイトボード';
                    else {
                        const labels = {
                            lecternShared: '共用演台', mcDesk: '司会者台',
                            screen: 'スクリーン', monitor: 'モニター'
                        };
                        label = labels[obj.furnitureType] || obj.furnitureType;
                    }
                }
                summary[label] = (summary[label] || 0) + 1;
            }
        });

        // サイドバーのバッジ更新
        Object.keys(counts).forEach(type => {
            const el = document.getElementById(`${type}Count`);
            if (el) {
                const limit = room.limits[type];
                const limitText = limit !== undefined ? limit : '-';
                el.textContent = `${counts[type]} / ${limitText}`;
                el.className = (limit !== undefined && counts[type] > limit) ? 'text-red-600 font-black' : 'text-slate-500 font-medium';
            }
        });

        // 備品リストテーブルの更新
        const listEl = document.getElementById('inventoryList');
        if (listEl) {
            const rows = Object.entries(summary).map(([name, count]) => `
                <tr class="border-b border-slate-100 last:border-0">
                    <td class="py-2 text-slate-700 font-medium">${name}</td>
                    <td class="py-2 text-right font-bold text-slate-900">${count}</td>
                </tr>
            `).join('');
            listEl.innerHTML = rows || '<tr><td class="py-2">なし</td><td class="py-2 text-right">0</td></tr>';
        }
    }

    // 家具追加時の制限チェック
    function canAddFurniture(type) {
        const room = ROOM_DATA[currentRoomId];
        if (!room) return false;

        const isDedicatedEquipment = ['seminarLectern', 'swinkLectern', 'swinkMcDesk'].includes(type);
        if (isDedicatedEquipment && (!room.limits || room.limits[type] === undefined)) {
            alert('この備品は現在の部屋には配置できません。');
            return false;
        }

        if (!room.limits || room.limits[type] === undefined) return true;

        let currentCount;
        if (type === 'seminarLectern') {
            currentCount = canvas.getObjects().filter(obj => obj.label === 'セミナー室演台' || obj.furnitureType === 'seminarLectern').length;
        } else if (type === 'swinkLectern' || type === 'swinkMcDesk') {
            currentCount = canvas.getObjects().filter(obj => obj.furnitureType === type).length;
        } else {
            currentCount = canvas.getObjects().filter(obj => obj.furnitureType === type && !obj.isSpecial).length;
        }

        if (currentCount >= room.limits[type]) {
            const labels = {
                desk: '机', chair: '椅子', whiteboard: 'ホワイトボード',
                lecternShared: '演台', mcDesk: '司会者台', screen: 'スクリーン', monitor: 'モニター',
                seminarLectern: 'セミナー室演台', swinkLectern: 'スインクホール演台', swinkMcDesk: 'スインクホール司会台'
            };
            alert(`${room.name}の${labels[type] || type}は最大${room.limits[type]}個まで配置可能です。`);
            return false;
        }
        return true;
    }

    // --- ここまで updateRoom ---

    // 書き出し機能 (PNG) - updateRoomの外に配置
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const roomName = ROOM_DATA[currentRoomId]?.name || 'layout';

            const performDownload = (multiplier = 2) => {
                const dataURL = canvas.toDataURL({
                    format: 'png',
                    quality: 1.0,
                    multiplier: multiplier
                });
                const link = document.createElement('a');
                link.download = `${roomName}_レイアウト_${new Date().toLocaleDateString()}.png`;
                link.href = dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            try {
                performDownload(2);
            } catch (err) {
                console.warn('Standard export failed, trying fallback (no background)...', err);

                // フォールバック: 背景画像を一時的に消して書き出す
                const bgImage = canvas.backgroundImage;
                if (bgImage) {
                    canvas.setBackgroundImage(null, () => {
                        try {
                            performDownload(2);
                            // 保存後に背景を戻す
                            canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
                            alert('ブラウザの制限により、背景の図面を除いた「家具配置のみ」で保存しました。');
                        } catch (err2) {
                            alert('画像の保存に失敗しました。ローカル環境(file://)で実行している場合、ブラウザのセキュリティ制限がかかることがあります。');
                        }
                    });
                } else {
                    alert('画像の保存に失敗しました。');
                }
            }
        });
    }

    // スインクホールのトグルボタン
    document.getElementById('toggleSwinkSeats')?.addEventListener('click', () => {
        swinkSeatsActive = !swinkSeatsActive;
        const status = document.getElementById('swinkSeatsStatus');
        const dot = status.querySelector('.dot');
        if (swinkSeatsActive) {
            status.classList.replace('bg-slate-300', 'bg-blue-600');
            dot.classList.replace('left-1', 'left-6');
        } else {
            status.classList.replace('bg-blue-600', 'bg-slate-300');
            dot.classList.replace('left-6', 'left-1');
        }
        updateRoom('swink');
    });

    // 方位の更新
    function updateCompass(roomId) {
        const compass = document.getElementById('compass');
        if (!compass) return;
        // スインクホールは右が北(90度)、その他は上が北(0度)
        const rotation = (roomId === 'swink') ? 90 : 0;
        compass.style.transform = `rotate(${rotation}deg)`;

        // 針の微細な揺れ（リアリティの演出）
        const needle = compass.querySelector('.relative.w-full.h-full');
        if (needle) {
            needle.animate([
                { transform: 'rotate(-1deg)' },
                { transform: 'rotate(1.2deg)' },
                { transform: 'rotate(-0.8deg)' },
                { transform: 'rotate(1deg)' },
                { transform: 'rotate(0deg)' }
            ], {
                duration: 4000,
                iterations: Infinity,
                easing: 'ease-in-out'
            });
        }
    }


    // 部屋選択イベント
    document.getElementById('roomSelect').addEventListener('change', (e) => {
        if (canvas.getObjects().length > 0) {
            if (!confirm('部屋を変更すると、配置した家具が消えるか位置がずれる可能性があります。よろしいですか？')) {
                e.target.value = currentRoomId;
                return;
            }
        }
        updateRoom(e.target.value);
    });

    // --------------------------------------------------
    // 5. 高度なツール (整列・計測)
    // --------------------------------------------------

    // 計測ツール
    let isMeasuring = false;
    let activeMeasureLine = null;
    let activeMeasureTick1 = null;
    let activeMeasureTick2 = null;
    let activeMeasureText = null;
    let measureObjects = []; // 確定済みの計測グループ

    document.getElementById('measureToolBtn').addEventListener('click', (e) => {
        isMeasuring = !isMeasuring;
        const btn = e.currentTarget;
        if (isMeasuring) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-white', 'text-slate-600');
            canvas.selection = false;
            canvas.getObjects().forEach(o => o.selectable = false);
            canvas.defaultCursor = 'crosshair';
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-white', 'text-slate-600');
            canvas.selection = true;
            canvas.getObjects().forEach(o => {
                if (o.furnitureType) o.selectable = true;
            });
            canvas.defaultCursor = 'default';
        }
    });

    // 計測クリア
    document.getElementById('clearMeasureBtn').addEventListener('click', () => {
        measureObjects.forEach(obj => canvas.remove(obj));
        measureObjects = [];
        canvas.requestRenderAll();
    });

    function createMeasureTick(x, y) {
        return new fabric.Line([-8, 0, 8, 0], {
            stroke: '#ef4444',
            strokeWidth: 2,
            left: x,
            top: y,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });
    }

    canvas.on('mouse:down', (opt) => {
        if (!isMeasuring) return;
        const pointer = canvas.getPointer(opt.e);
        
        const snap = SCALE * 0.1;
        const startX = Math.round(pointer.x / snap) * snap;
        const startY = Math.round(pointer.y / snap) * snap;

        activeMeasureLine = new fabric.Line([startX, startY, startX, startY], {
            strokeWidth: 2,
            stroke: '#ef4444',
            selectable: false,
            evented: false
        });

        activeMeasureTick1 = createMeasureTick(startX, startY);
        activeMeasureTick2 = createMeasureTick(startX, startY);

        activeMeasureText = new fabric.Text('0mm', {
            fontSize: 14,
            fontWeight: 'bold',
            fill: '#ef4444',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: 4,
            rx: 4, ry: 4,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });

        canvas.add(activeMeasureLine, activeMeasureTick1, activeMeasureTick2, activeMeasureText);
    });

    canvas.on('mouse:move', (opt) => {
        if (!isMeasuring || !activeMeasureLine) return;
        const pointer = canvas.getPointer(opt.e);
        
        const snap = SCALE * 0.1;
        const endX = Math.round(pointer.x / snap) * snap;
        const endY = Math.round(pointer.y / snap) * snap;

        activeMeasureLine.set({ x2: endX, y2: endY });
        activeMeasureTick2.set({ left: endX, top: endY });

        // 距離計算
        const dx = endX - activeMeasureLine.x1;
        const dy = endY - activeMeasureLine.y1;
        const distancePx = Math.sqrt(dx * dx + dy * dy);
        const distanceMm = Math.round((distancePx / SCALE) * 1000);
        
        // 角度計算とティックの回転
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        activeMeasureTick1.set('angle', angle + 45);
        activeMeasureTick2.set('angle', angle + 45);

        activeMeasureText.set({
            text: `${distanceMm}mm`,
            left: (activeMeasureLine.x1 + endX) / 2,
            top: (activeMeasureLine.y1 + endY) / 2 - 15
        });
        
        canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
        if (!isMeasuring || !activeMeasureLine) return;

        // 非常に短い計測（誤クリック）は除外
        const dx = activeMeasureLine.x2 - activeMeasureLine.x1;
        const dy = activeMeasureLine.y2 - activeMeasureLine.y1;
        if (Math.sqrt(dx*dx + dy*dy) < 5) {
            canvas.remove(activeMeasureLine, activeMeasureTick1, activeMeasureTick2, activeMeasureText);
        } else {
            // 一つのグループにまとめて管理しやすくする
            const group = new fabric.Group([
                activeMeasureLine, 
                activeMeasureTick1, 
                activeMeasureTick2, 
                activeMeasureText
            ], {
                selectable: false,
                evented: false
            });
            // 個別のオブジェクトを削除してグループを追加
            canvas.remove(activeMeasureLine, activeMeasureTick1, activeMeasureTick2, activeMeasureText);
            canvas.add(group);
            measureObjects.push(group);
        }

        activeMeasureLine = null;
        activeMeasureTick1 = null;
        activeMeasureTick2 = null;
        activeMeasureText = null;
        canvas.requestRenderAll();
    });

    // 初期表示
    updateRoom('room1');


    // --------------------------------------------------
    // 3. 家具追加機能
    // --------------------------------------------------

    function addFurniture(type, options = {}) {
        if (!options.isInitial && !canAddFurniture(type)) return;

        const defaultLeft = canvas.width / 2 + (Math.random() * 20 - 10);
        const defaultTop = canvas.height / 2 + (Math.random() * 20 - 10);
        const style = {
            desk: { fill: '#ffffff', stroke: '#94a3b8', accent: '#f8fafc' },
            chair: { fill: '#64748b', stroke: '#334155', accent: '#94a3b8' }, // スレートブルー（明るく見やすく）
            whiteboard: { fill: '#ffffff', stroke: '#64748b', accent: '#f8fafc' },
            lecternShared: { fill: '#475569', stroke: '#1e293b', accent: '#64748b' },
            mcDesk: { fill: '#475569', stroke: '#1e293b', accent: '#64748b' },
            screen: { fill: '#334155', stroke: '#0f172a', accent: '#475569' },
            monitor: { fill: '#0f172a', stroke: '#000000', accent: '#1e293b' },
            seminarLectern: { fill: '#ffffff', stroke: '#94a3b8', accent: '#f8fafc' },
            swinkLectern: { fill: '#ffffff', stroke: '#94a3b8', accent: '#f8fafc' },
            swinkMcDesk: { fill: '#475569', stroke: '#1e293b', accent: '#64748b' }
        }[type];

        let furnitureGroup;
        const groupItems = [];

        if (type === 'desk' || type === 'seminarLectern' || type === 'swinkLectern') {
            const defaultW = type === 'swinkLectern' ? 1.5 : (type === 'seminarLectern' ? 1.2 : 1.8);
            const defaultH = type === 'swinkLectern' ? 0.7 : 0.6;
            const w = (options.w || defaultW) * SCALE;
            const h = (options.h || defaultH) * SCALE;

            if (options.label === '演台' || options.label === 'セミナー室演台' || type === 'seminarLectern' || type === 'swinkLectern') {
                // 演台：木目調で立体感のあるデザイン
                const body = new fabric.Rect({
                    width: w, height: h, 
                    fill: new fabric.Gradient({
                        type: 'linear',
                        coords: { x1: 0, y1: 0, x2: 0, y2: h },
                        colorStops: [
                            { offset: 0, color: '#fef3c7' }, // 薄い木の色
                            { offset: 1, color: '#fde68a' }  // 濃い木の色
                        ]
                    }),
                    stroke: '#d97706', strokeWidth: 1.5, rx: 2, ry: 2, originX: 'center', originY: 'center'
                });
                groupItems.push(body);

                // 天板のエッジ（立体感）
                const edge = new fabric.Rect({
                    width: w - 4, height: h - 4, fill: 'transparent', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 1, originX: 'center', originY: 'center'
                });
                groupItems.push(edge);

                // 前面の装飾パネル（さらに立体的に）
                const frontPanel = new fabric.Rect({
                    width: w, height: 6, fill: '#b45309', top: h / 2 - 3, originX: 'center', originY: 'center'
                });
                groupItems.push(frontPanel);

                // 上部の小さな段差
                const topStep = new fabric.Rect({
                    width: w * 0.9, height: 2, fill: 'rgba(255,255,255,0.4)', top: -h / 2 + 4, originX: 'center', originY: 'center'
                });
                groupItems.push(topStep);
            } else if (options.label === '操作卓') {
                // 操作卓：機器やモニターがあるデスク（isWhite 指定または研修室の場合は白色）
                const isWhiteDesk = options.isWhite || options.color === 'white' || (currentRoomId === 'training' && options.label === '操作卓');
                const bodyColor = isWhiteDesk ? '#ffffff' : '#334155';
                const strokeColor = isWhiteDesk ? '#cbd5e1' : '#0f172a';
                const panelColor = isWhiteDesk ? '#e2e8f0' : '#475569';
                const monitorColor = isWhiteDesk ? '#64748b' : '#94a3b8';

                const body = new fabric.Rect({
                    width: w, height: h, fill: bodyColor, stroke: strokeColor, strokeWidth: 2, rx: 3, ry: 3, originX: 'center', originY: 'center'
                });
                groupItems.push(body);
                // モニター（画面）の表現
                const monitor = new fabric.Rect({
                    width: w * 0.5, height: Math.max(3, h * 0.08), fill: monitorColor, top: -h / 4, originX: 'center', originY: 'center'
                });
                groupItems.push(monitor);
                // 操作部（キーボード等）
                const panel = new fabric.Rect({
                    width: w * 0.7, height: h * 0.3, fill: panelColor, top: h / 4, originX: 'center', originY: 'center'
                });
                groupItems.push(panel);
            } else {
                // 通常の机 (リッチな質感)
                const body = new fabric.Rect({
                    width: w, height: h, 
                    fill: new fabric.Gradient({
                        type: 'linear',
                        coords: { x1: 0, y1: 0, x2: 0, y2: h },
                        colorStops: [
                            { offset: 0, color: '#ffffff' },
                            { offset: 1, color: '#f1f5f9' }
                        ]
                    }),
                    stroke: '#cbd5e1', strokeWidth: 1.2, rx: 6, ry: 6, originX: 'center', originY: 'center'
                });
                groupItems.push(body);

                // エッジハイライト
                const highlight = new fabric.Rect({
                    width: w - 3, height: h - 3, fill: 'transparent',
                    stroke: 'rgba(255,255,255,0.9)', strokeWidth: 1, rx: 5, ry: 5,
                    originX: 'center', originY: 'center', selectable: false
                });
                groupItems.push(highlight);

                // デスクの装飾ライン
                const edge = new fabric.Rect({
                    width: w - 12, height: 2, fill: style.accent, top: h / 2 - 6, originX: 'center', originY: 'center', selectable: false
                });
                groupItems.push(edge);
            }

            // ラベルがある場合
            if (options.label) {
                const isWhiteDesk = options.isWhite || options.color === 'white' || (currentRoomId === 'training' && options.label === '操作卓');
                const labelColor = (options.label === '操作卓') ? (isWhiteDesk ? '#334155' : '#f8fafc') : '#64748b';
                const label = new fabric.Text(options.label, {
                    fontSize: 12, fill: labelColor, fontWeight: 'bold', originX: 'center', originY: 'center'
                });
                groupItems.push(label);
            }
            furnitureGroup = new fabric.Group(groupItems);
        } else if (type === 'lecternShared') {
            const w = 0.9 * SCALE;
            const h = 0.5 * SCALE;
            // 木目調で立体感のあるデザイン (セミナー室演台と統一)
            const body = new fabric.Rect({
                width: w, height: h, 
                fill: new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 0, y2: h },
                    colorStops: [
                        { offset: 0, color: '#fef3c7' },
                        { offset: 1, color: '#fde68a' }
                    ]
                }),
                stroke: '#d97706', strokeWidth: 1.5, rx: 2, ry: 2, originX: 'center', originY: 'center'
            });
            groupItems.push(body);
            const edge = new fabric.Rect({
                width: w - 4, height: h - 4, fill: 'transparent', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 1, originX: 'center', originY: 'center'
            });
            groupItems.push(edge);
            const frontPanel = new fabric.Rect({
                width: w, height: 6, fill: '#b45309', top: h / 2 - 3, originX: 'center', originY: 'center'
            });
            groupItems.push(frontPanel);
            const label = new fabric.Text('演台', {
                fontSize: 10, fill: '#64748b', fontWeight: 'bold', originX: 'center', originY: 'center'
            });
            groupItems.push(label);
            furnitureGroup = new fabric.Group(groupItems);
        } else if (type === 'mcDesk' || type === 'swinkMcDesk') {
            const w = (type === 'swinkMcDesk' ? 0.6 : 0.75) * SCALE;
            const h = (type === 'swinkMcDesk' ? 0.45 : 0.5) * SCALE;
            // 濃いめの木目調で立体感のあるデザイン
            const body = new fabric.Rect({
                width: w, height: h, 
                fill: new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 0, y2: h },
                    colorStops: [
                        { offset: 0, color: '#d97706' }, // 濃い木の色（明るめ）
                        { offset: 1, color: '#78350f' }  // 濃い木の色（暗め）
                    ]
                }),
                stroke: '#451a03', strokeWidth: 1.5, rx: 2, ry: 2, originX: 'center', originY: 'center'
            });
            groupItems.push(body);
            const edge = new fabric.Rect({
                width: w - 4, height: h - 4, fill: 'transparent', stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, originX: 'center', originY: 'center'
            });
            groupItems.push(edge);
            const frontPanel = new fabric.Rect({
                width: w, height: 6, fill: '#451a03', top: h / 2 - 3, originX: 'center', originY: 'center'
            });
            groupItems.push(frontPanel);
            const label = new fabric.Text('司会台', {
                fontSize: 10, fill: '#f8fafc', fontWeight: 'bold', originX: 'center', originY: 'center'
            });
            groupItems.push(label);
            furnitureGroup = new fabric.Group(groupItems);
        } else if (type === 'screen') {
            const w = 2.1 * SCALE;
            const h = 0.25 * SCALE; // 少し厚みを持たせる
            
            // スクリーンケース（収納部分）
            const caseBody = new fabric.Rect({
                width: w, height: h * 0.6, 
                fill: new fabric.Gradient({
                    type: 'linear', coords: { x1: 0, y1: 0, x2: 0, y2: h * 0.6 },
                    colorStops: [ { offset: 0, color: '#f1f5f9' }, { offset: 1, color: '#94a3b8' } ]
                }),
                stroke: '#64748b', strokeWidth: 1, rx: 2, ry: 2, originX: 'center', originY: 'center'
            });
            groupItems.push(caseBody);

            // 展開されたスクリーンの厚み（わずかな奥行き）
            const screenSheet = new fabric.Rect({
                width: w - 10, height: 4, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 0.5, top: h / 2, originX: 'center', originY: 'center'
            });
            groupItems.push(screenSheet);

            // 自立用スタンド（両端の脚）
            const legL = new fabric.Rect({
                width: 6, height: h * 1.5, fill: '#475569', left: -w / 2 + 10, originX: 'center', originY: 'center'
            });
            const legR = new fabric.Rect({
                width: 6, height: h * 1.5, fill: '#475569', left: w / 2 - 10, originX: 'center', originY: 'center'
            });
            groupItems.push(legL, legR);

            const label = new fabric.Text('SCREEN', {
                fontSize: 8, fill: '#64748b', fontWeight: 'bold', originX: 'center', originY: 'center', top: -h / 2
            });
            groupItems.push(label);
            furnitureGroup = new fabric.Group(groupItems);
        } else if (type === 'monitor') {
            const w = 1.4 * SCALE;
            const h = 0.35 * SCALE;
            
            // 外枠（フレーム）
            const body = new fabric.Rect({
                width: w, height: h, fill: '#0f172a', stroke: '#334155', strokeWidth: 1, rx: 2, ry: 2, originX: 'center', originY: 'center'
            });
            groupItems.push(body);

            // 液晶パネル面（グラデーション）
            const screen = new fabric.Rect({
                width: w - 4, height: h - 4, 
                fill: new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 0, y2: h - 4 },
                    colorStops: [
                        { offset: 0, color: '#1e293b' },
                        { offset: 1, color: '#0f172a' }
                    ]
                }),
                originX: 'center', originY: 'center'
            });
            groupItems.push(screen);

            // 画面のハイライト（光沢感）
            const shine = new fabric.Rect({
                width: w - 10, height: 2, fill: 'rgba(255,255,255,0.1)', top: -h / 2 + 6, originX: 'center', originY: 'center'
            });
            groupItems.push(shine);

            // 背面の支柱と台座（立体感を出すためのパーツ）
            const stand = new fabric.Rect({
                width: w * 0.4, height: 4, fill: '#334155', top: h / 2, originX: 'center', originY: 'center'
            });
            groupItems.push(stand);

            const label = new fabric.Text('MONITOR', {
                fontSize: 8, fill: '#475569', fontWeight: 'bold', originX: 'center', originY: 'center'
            });
            groupItems.push(label);
            furnitureGroup = new fabric.Group(groupItems);
        } else if (type === 'chair') {
            const isStacking = (currentRoomId === 'swink' || currentRoomId === 'seminar');
            const r = (0.42 * SCALE) / 2; // 基本サイズ

            if (isStacking) {
                const w = 0.55 * SCALE;
                const h = 0.50 * SCALE;

                const body = new fabric.Rect({
                    width: w, height: h, rx: 4, ry: 4,
                    fill: style.fill, stroke: style.stroke, strokeWidth: 1.5, originX: 'center', originY: 'center'
                });
                groupItems.push(body);
                const back = new fabric.Rect({
                    width: w * 0.9, height: 6, rx: 2, ry: 2,
                    fill: style.stroke, top: -h / 2 + 5, originX: 'center', originY: 'center'
                });
                groupItems.push(back);
            } else {
                const body = new fabric.Circle({
                    radius: r, fill: style.fill, stroke: style.stroke, strokeWidth: 1.2, originX: 'center', originY: 'center'
                });
                groupItems.push(body);

                // キャスター（脚の先）
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 72 - 90) * (Math.PI / 180);
                    const leg = new fabric.Line([0, 0, Math.cos(angle) * r, Math.sin(angle) * r], {
                        stroke: style.accent, strokeWidth: 1, selectable: false
                    });
                    const wheel = new fabric.Circle({
                        radius: 2, fill: style.stroke,
                        left: Math.cos(angle) * (r + 2),
                        top: Math.sin(angle) * (r + 2),
                        originX: 'center', originY: 'center'
                    });
                    groupItems.push(leg);
                    groupItems.push(wheel);
                }

                // 背もたれのアーチ
                const backrest = new fabric.Path(`M ${-r * 0.8} ${-r * 0.2} A ${r} ${r} 0 0 1 ${r * 0.8} ${-r * 0.2}`, {
                    fill: 'transparent', stroke: style.stroke, strokeWidth: 2.5, originX: 'center', originY: 'center', top: -r * 0.5
                });
                groupItems.push(backrest);
            }
            furnitureGroup = new fabric.Group(groupItems);
        } else if (type === 'whiteboard') {
            const w = 1.8 * SCALE;
            const h = 0.5 * SCALE;
            const body = new fabric.Rect({
                width: w, height: h, fill: 'transparent', originX: 'center', originY: 'center'
            });
            groupItems.push(body);
            // ボード本体 (薄い板を表現)
            const board = new fabric.Rect({
                width: w, height: 8, fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 1.5,
                top: -h/4, originX: 'center', originY: 'center'
            });
            groupItems.push(board);
            // 脚の部分 (H型)
            const legBase = new fabric.Rect({
                width: w * 0.8, height: 4, fill: '#cbd5e1', top: h/4, originX: 'center', originY: 'center'
            });
            groupItems.push(legBase);
            const legLeft = new fabric.Rect({
                width: 4, height: h, fill: '#94a3b8', left: -w * 0.4, originX: 'center', originY: 'center'
            });
            groupItems.push(legLeft);
            const legRight = new fabric.Rect({
                width: 4, height: h, fill: '#94a3b8', left: w * 0.4, originX: 'center', originY: 'center'
            });
            groupItems.push(legRight);
            
            furnitureGroup = new fabric.Group(groupItems);
        }

        if (furnitureGroup) {
            furnitureGroup.set({
                left: options.left || defaultLeft,
                top: options.top || defaultTop,
                angle: options.angle || 0,
                originX: 'center', originY: 'center',
                lockScalingX: true, lockScalingY: true,
                opacity: 1,
                // コントラストを効かせた影
                shadow: new fabric.Shadow({
                    color: 'rgba(0,0,0,0.2)',
                    blur: 25,
                    offsetX: 6,
                    offsetY: 10
                })
            });

            furnitureGroup.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false, tl: false, tr: false, bl: false, br: false, mtr: true });
            furnitureGroup.set('furnitureType', type);
            if (options.label) furnitureGroup.set('label', options.label);
            if (options.isSpecial) furnitureGroup.set('isSpecial', true);
            
            // 固定設定 (選択不可にする)
            if (options.isFixed) {
                furnitureGroup.set({
                    selectable: false,
                    evented: false,
                    hoverCursor: 'default'
                });
            }

            canvas.add(furnitureGroup);

            // ポップアップアニメーション (透明度ではなくスケールで表現)
            if (options.animate) {
                const targetScaleX = furnitureGroup.scaleX;
                const targetScaleY = furnitureGroup.scaleY;
                furnitureGroup.set({ scaleX: 0.8, scaleY: 0.8 });
                furnitureGroup.animate({ scaleX: targetScaleX, scaleY: targetScaleY }, {
                    duration: 400,
                    onChange: canvas.requestRenderAll.bind(canvas),
                    easing: fabric.util.ease.easeOutBack
                });
            }

            if (!options.left) canvas.setActiveObject(furnitureGroup);
            canvas.requestRenderAll();
        }
    }

    document.getElementById('addDeskBtn').addEventListener('click', () => addFurniture('desk'));
    document.getElementById('addChairBtn').addEventListener('click', () => addFurniture('chair'));
    document.getElementById('addWhiteboardBtn').addEventListener('click', () => addFurniture('whiteboard'));
    document.getElementById('addLecternSharedBtn').addEventListener('click', () => addFurniture('lecternShared'));
    document.getElementById('addMcDeskBtn')?.addEventListener('click', () => addFurniture('mcDesk'));
    document.getElementById('addSeminarLecternBtn')?.addEventListener('click', () => addFurniture('seminarLectern', { label: 'セミナー室演台', w: 1.2, h: 0.6, isSpecial: true }));
    document.getElementById('addSwinkLecternBtn')?.addEventListener('click', () => addFurniture('swinkLectern', { label: 'スインクホール演台', w: 1.5, h: 0.7, isSpecial: true }));
    document.getElementById('addSwinkMcDeskBtn')?.addEventListener('click', () => addFurniture('swinkMcDesk', { label: '司会台', w: 0.6, h: 0.45, isSpecial: true }));
    document.getElementById('addScreenBtn').addEventListener('click', () => addFurniture('screen'));
    document.getElementById('addMonitorBtn').addEventListener('click', () => addFurniture('monitor'));


    // --------------------------------------------------
    // 4. 全体操作
    // --------------------------------------------------

    document.getElementById('clearBtn').addEventListener('click', () => {
        if (confirm('配置した家具をすべて削除しますか？')) {
            canvas.clear();
            // 背景再設定
            updateRoom(currentRoomId);
        }
    });



    // --------------------------------------------------
    // 5. 操作性向上（スナップ機能）
    // --------------------------------------------------

    let isSnapEnabled = true;
    const SNAP_STEP_M = 0.1; // 10cm単位

    document.getElementById('snapToggle').addEventListener('change', (e) => {
        isSnapEnabled = e.target.checked;
    });

    // 削除キー
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length) {
                if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
                canvas.discardActiveObject();
                activeObjects.forEach(obj => canvas.remove(obj));
            }
        }
    });

    // --------------------------------------------------
    // 6. データの永続化 (localStorage)
    // --------------------------------------------------

    function loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const roomName = ROOM_DATA[data.roomId]?.name || '不明な部屋';

                if (confirm(`${roomName} のファイルデータを読み込みますか？\n現在の配置は上書きされます。`)) {
                    // 部屋の切り替え
                    const roomSelect = document.getElementById('roomSelect');
                    roomSelect.value = data.roomId;
                    currentRoomId = data.roomId;
                    swinkSeatsActive = !!data.swinkSeatsActive;

                    // 部屋を初期化
                    updateRoom(data.roomId);

                    // 初期配置をクリア
                    canvas.getObjects().filter(obj => obj.furnitureType).forEach(obj => canvas.remove(obj));

                    // オブジェクト復元
                    isUpdating = true;
                    fabric.util.enlivenObjects(data.objects, (enlivenedObjects) => {
                        enlivenedObjects.forEach(obj => {
                            obj.set({
                                lockScalingX: true,
                                lockScalingY: true,
                                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.06)', blur: 12, offsetX: 3, offsetY: 3 })
                            });
                            obj.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false, tl: false, tr: false, bl: false, br: false, mtr: true });
                            canvas.add(obj);
                        });
                        isUpdating = false;
                        canvas.requestRenderAll();
                        updateCapacityDisplay();
                        
                        // フィードバック
                        const btn = document.getElementById('loadFileBtn');
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '✨ 読込完了';
                        setTimeout(() => btn.innerHTML = originalText, 2000);
                    });
                }
            } catch (err) {
                console.error('File load failed', err);
                alert('ファイルの読み込みに失敗しました。有効なJSONファイルか確認してください。');
            }
        };
        reader.readAsText(file);
    }

    document.getElementById('loadFileBtn')?.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput')?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadFromFile(e.target.files[0]);
        }
    });

    function saveToFile() {
        const furniture = canvas.getObjects().filter(obj => obj.furnitureType);
        if (furniture.length === 0) {
            alert('配置されている家具がありません。');
            return;
        }

        const data = {
            version: "2.0",
            roomId: currentRoomId,
            roomName: ROOM_DATA[currentRoomId].name,
            swinkSeatsActive: swinkSeatsActive,
            timestamp: new Date().toISOString(),
            objects: furniture.map(obj => obj.toObject(['furnitureType', 'isSpecial', 'label', 'w', 'h']))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${ROOM_DATA[currentRoomId].name}_layout_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // フィードバック
        const btn = document.getElementById('saveFileBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ 保存完了';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }

    document.getElementById('saveFileBtn').addEventListener('click', saveToFile);

    // リアルタイム更新用リスナー
    canvas.on('object:added', updateCapacityDisplay);
    canvas.on('object:removed', updateCapacityDisplay);
    canvas.on('object:modified', updateCapacityDisplay); // 移動・回転後も更新

    // --------------------------------------------------
    // 初期表示の更新
    // --------------------------------------------------
    updateCapacityDisplay();
    updateRoom(currentRoomId);

    // --------------------------------------------------
    // 7. 表示・回転操作パネル (Zoom & Rotation Controls)
    // --------------------------------------------------
    let currentZoom = 100;
    let currentRoomRotation = 0;

    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValueText = document.getElementById('zoomValueText');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const canvasScaleInner = document.getElementById('canvasScaleInner');
    const compass = document.getElementById('compass');
    const rotateBtn = document.getElementById('rotateBtn');
    const rotateBtn180 = document.getElementById('rotateBtn180');

    function applyZoom(newZoom) {
        currentZoom = Math.min(250, Math.max(40, newZoom));
        if (zoomSlider) zoomSlider.value = currentZoom;
        if (zoomValueText) zoomValueText.textContent = `${currentZoom}%`;
        
        if (canvasScaleInner) {
            canvasScaleInner.style.transform = `scale(${currentZoom / 100})`;
        }
    }

    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            applyZoom(parseInt(e.target.value, 10));
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            applyZoom(currentZoom - 15);
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            applyZoom(currentZoom + 15);
        });
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            applyZoom(100);
        });
    }

    function rotateSelectedObjects(angleDelta) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) {
            alert('回転させる備品をクリックして選択してください。');
            return;
        }

        // 現在の角度 (0, 90, 180, 270) を取得し、正確に angleDelta (90° または 180°) を加算
        let currentAngle = Math.round(activeObject.angle || 0);
        // 負の角度対策も含めて 0~359度 にクランプ
        let targetAngle = (currentAngle + angleDelta) % 360;
        if (targetAngle < 0) targetAngle += 360;

        activeObject.set('angle', targetAngle);
        activeObject.setCoords();
        canvas.requestRenderAll();
        saveState();
    }

    if (rotateBtn) {
        rotateBtn.onclick = (e) => {
            e.preventDefault();
            rotateSelectedObjects(90);
        };
    }

    if (rotateBtn180) {
        rotateBtn180.onclick = (e) => {
            e.preventDefault();
            rotateSelectedObjects(180);
        };
    }
});

