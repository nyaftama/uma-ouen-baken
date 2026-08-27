
const version = document.getElementById('version')?.textContent?.trim() || Date.now().toString();
const umaCsvPath = './data/uma_list.csv?v=' + version;

let allUmaData = [];
let allRaceData = [];

let ticketAmounts = {};
let ticketTypes = {};
let umaNumbers = {};

let cartItems = [];
let cartAmount = 100;
let currentGeneratingTicketParams = null;

let advancedSettings = {
    bitmapText: false
};

try {
    const savedAdvancedSettings = localStorage.getItem('uma_baken_advanced_settings_allstar');
    if (savedAdvancedSettings) {
        advancedSettings = { ...advancedSettings, ...JSON.parse(savedAdvancedSettings) };
    }
} catch (e) {
    console.error(e);
}

let reflectCharColor = true;
try {
    const savedReflectColor = localStorage.getItem('uma_baken_reflect_color');
    if (savedReflectColor !== null) {
        reflectCharColor = savedReflectColor === 'true';
    }
} catch (e) {
    console.error(e);
}

let invertCharColor = false;
try {
    const savedInvertColor = localStorage.getItem('uma_baken_invert_color');
    if (savedInvertColor !== null) {
        invertCharColor = savedInvertColor === 'true';
    }
} catch (e) {
    console.error(e);
}

function updateInvertColorVisibility() {
    const invertSubItem = document.getElementById('invertColorSubItem');
    const modalInvertSubItem = document.getElementById('modalInvertColorSubItem');

    if (invertSubItem) {
        if (reflectCharColor) {
            invertSubItem.style.opacity = '1';
            invertSubItem.style.pointerEvents = 'auto';
        } else {
            invertSubItem.style.opacity = '0.4';
            invertSubItem.style.pointerEvents = 'none';
        }
    }
    if (modalInvertSubItem) {
        if (reflectCharColor) {
            modalInvertSubItem.style.opacity = '1';
            modalInvertSubItem.style.pointerEvents = 'auto';
        } else {
            modalInvertSubItem.style.opacity = '0.4';
            modalInvertSubItem.style.pointerEvents = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('reflectCharColorCheckbox');
    const modalCheckbox = document.getElementById('modalReflectCharColorCheckbox');
    const bitmapCheckbox = document.getElementById('bitmapTextCheckbox');
    const modalBitmapCheckbox = document.getElementById('modalBitmapTextCheckbox');
    const invertCheckbox = document.getElementById('invertColorCheckbox');
    const modalInvertCheckbox = document.getElementById('modalInvertColorCheckbox');

    if (checkbox) checkbox.checked = reflectCharColor;
    if (modalCheckbox) modalCheckbox.checked = reflectCharColor;
    if (bitmapCheckbox) bitmapCheckbox.checked = advancedSettings.bitmapText;
    if (modalBitmapCheckbox) modalBitmapCheckbox.checked = advancedSettings.bitmapText;
    if (invertCheckbox) invertCheckbox.checked = invertCharColor;
    if (modalInvertCheckbox) modalInvertCheckbox.checked = invertCharColor;

    updateInvertColorVisibility();

    const handleReflectColorChange = (isChecked, source) => {
        reflectCharColor = isChecked;
        try {
            localStorage.setItem('uma_baken_reflect_color', reflectCharColor);
        } catch (err) {
            console.error(err);
        }

        // Sync check states
        if (source === 'main' && modalCheckbox) {
            modalCheckbox.checked = isChecked;
        } else if (source === 'modal' && checkbox) {
            checkbox.checked = isChecked;
        }

        updateInvertColorVisibility();

        // If changed from modal and ticket is currently shown, regenerate it
        if (source === 'modal' && currentGeneratingTicketParams) {
            setTimeout(() => {
                const { data, amount, betType } = currentGeneratingTicketParams;
                generateTicket(data, amount, betType, true);
            }, 50);
        }
    };

    const handleBitmapTextChange = (isChecked, source) => {
        advancedSettings.bitmapText = isChecked;
        try {
            localStorage.setItem('uma_baken_advanced_settings_allstar', JSON.stringify(advancedSettings));
        } catch (err) {
            console.error(err);
        }

        // Sync check states
        if (source === 'main' && modalBitmapCheckbox) {
            modalBitmapCheckbox.checked = isChecked;
        } else if (source === 'modal' && bitmapCheckbox) {
            bitmapCheckbox.checked = isChecked;
        }

        // If changed from modal and ticket is currently shown, regenerate it
        if (source === 'modal' && currentGeneratingTicketParams) {
            setTimeout(() => {
                const { data, amount, betType } = currentGeneratingTicketParams;
                generateTicket(data, amount, betType, true);
            }, 50);
        }
    };

    const handleInvertColorChange = (isChecked, source) => {
        invertCharColor = isChecked;
        try {
            localStorage.setItem('uma_baken_invert_color', invertCharColor);
        } catch (err) {
            console.error(err);
        }

        // Sync check states
        if (source === 'main' && modalInvertCheckbox) {
            modalInvertCheckbox.checked = isChecked;
        } else if (source === 'modal' && invertCheckbox) {
            invertCheckbox.checked = isChecked;
        }

        // If changed from modal and ticket is currently shown, regenerate it
        if (source === 'modal' && currentGeneratingTicketParams) {
            setTimeout(() => {
                const { data, amount, betType } = currentGeneratingTicketParams;
                generateTicket(data, amount, betType, true);
            }, 50);
        }
    };

    if (checkbox) {
        checkbox.addEventListener('change', (e) => handleReflectColorChange(e.target.checked, 'main'));
    }
    if (modalCheckbox) {
        modalCheckbox.addEventListener('change', (e) => handleReflectColorChange(e.target.checked, 'modal'));
    }

    if (bitmapCheckbox) {
        bitmapCheckbox.addEventListener('change', (e) => handleBitmapTextChange(e.target.checked, 'main'));
    }
    if (modalBitmapCheckbox) {
        modalBitmapCheckbox.addEventListener('change', (e) => handleBitmapTextChange(e.target.checked, 'modal'));
    }

    if (invertCheckbox) {
        invertCheckbox.addEventListener('change', (e) => handleInvertColorChange(e.target.checked, 'main'));
    }
    if (modalInvertCheckbox) {
        modalInvertCheckbox.addEventListener('change', (e) => handleInvertColorChange(e.target.checked, 'modal'));
    }

    const modalModeSwitchBtn = document.getElementById('modalModeSwitchBtn');
    const modalModeSwitchLabel = document.getElementById('modalModeSwitchLabel');
    const toggleModalMode = (e) => {
        if (e) e.stopPropagation();
        const currentMode = getDisplayMode();
        const nextMode = (currentMode === 'uma') ? 'cast' : 'uma';
        setDisplayMode(nextMode);
    };
    if (modalModeSwitchBtn) {
        modalModeSwitchBtn.addEventListener('click', toggleModalMode);
    }
    if (modalModeSwitchLabel) {
        modalModeSwitchLabel.addEventListener('click', toggleModalMode);
    }

    const shareCopyBtn = document.getElementById('shareCopyBtn');
    if (shareCopyBtn) {
        shareCopyBtn.addEventListener('click', async () => {
            if (!shareImagePreview.src || shareImagePreview.src === '' || shareImageLoading.style.display === 'flex') {
                showToast('画像を生成中です');
                return;
            }
            try {
                const res = await fetch(shareImagePreview.src);
                const blob = await res.blob();
                if (navigator.clipboard && navigator.clipboard.write) {
                    const item = new ClipboardItem({ [blob.type]: blob });
                    await navigator.clipboard.write([item]);
                    showToast('画像をクリップボードにコピーしました');
                } else {
                    throw new Error('Clipboard API not supported');
                }
            } catch (err) {
                console.error('クリップボードコピー失敗:', err);
                showToast('画像のコピーに失敗しました（画像を長押しして保存してください）');
            }
        });
    }

    const shareDownloadBtn = document.getElementById('shareDownloadBtn');
    if (shareDownloadBtn) {
        shareDownloadBtn.addEventListener('click', () => {
            if (!shareImagePreview.src || shareImagePreview.src === '' || shareImageLoading.style.display === 'flex') {
                showToast('画像を生成中です');
                return;
            }
            let targetName = 'ticket';
            if (currentGeneratingTicketParams && currentGeneratingTicketParams.data) {
                const d = currentGeneratingTicketParams.data;
                if (Array.isArray(d)) {
                    targetName = d.map(r => (r.uma_name || r.cast_name || '').replace('役', '').trim()).filter(Boolean).join('_');
                } else if (d) {
                    targetName = (d.uma_name || d.cast_name || 'ticket').replace('役', '').trim();
                }
            }
            const downloadFileName = `推しバ券_${targetName}.png`;
            const link = document.createElement('a');
            link.download = downloadFileName;
            link.href = shareImagePreview.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('画像をダウンロードしました');
        });
    }

    if (shareImagePreview) {
        shareImagePreview.addEventListener('contextmenu', () => {
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        });
    }

    const toggleTopBtn = document.getElementById('toggleTopAreaBtn');
    if (toggleTopBtn) {
        toggleTopBtn.addEventListener('click', () => {
            currentTopView = (currentTopView === 'event') ? 'cart' : 'event';
            updateTopAreaView();
        });
    }

    updateTopAreaView();
});

function hexToHsl(hex) {
    hex = hex.replace(/^#/, '').trim();
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        r = 0.5; g = 0.5; b = 0.5;
    }
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function getThemeColors(mainHex, subHex) {
    const hslMain = hexToHsl(mainHex);
    const hslSub = subHex ? hexToHsl(subHex) : hslMain;
    const bgLightness = 90;
    const borderLightness = Math.min(30, Math.max(10, hslMain.l - 20));
    const watermarkLightness = 93;
    const brightColor = `hsl(${hslMain.h}, ${hslMain.s}%, ${bgLightness}%)`;
    return {
        bg: brightColor,
        cardBg: `linear-gradient(135deg, ${brightColor} 0%, transparent 100%)`,
        theme: `hsl(${hslMain.h}, ${hslMain.s}%, ${borderLightness}%)`,
        watermark: `hsl(${hslSub.h}, ${hslSub.s}%, ${watermarkLightness}%)`
    };
}

function applyBakenThemeColor(data) {
    const bakenDOM = document.getElementById('bakenSlip');
    if (!bakenDOM) return;

    const isEnabled = reflectCharColor;
    if (!isEnabled) {
        bakenDOM.style.removeProperty('--baken-bg-color');
        bakenDOM.style.removeProperty('--baken-theme-color');
        bakenDOM.style.removeProperty('--baken-watermark-color');
        return;
    }

    const isMulti = Array.isArray(data);
    const firstData = isMulti ? data[0] : data;
    if (!firstData) {
        bakenDOM.style.removeProperty('--baken-bg-color');
        bakenDOM.style.removeProperty('--baken-theme-color');
        bakenDOM.style.removeProperty('--baken-watermark-color');
        return;
    }

    let mainColor = firstData.main_color;
    let subColor = firstData.sub_color;

    if (!mainColor) {
        const castName = firstData.cast_name;
        const cleanUmaName = (firstData.uma_name || '').replace('役', '').trim();
        const found = allUmaData.find(r => r.main_color && (
            (r.cast_name && r.cast_name === castName && r.uma_name && r.uma_name.replace('役', '').trim() === cleanUmaName) ||
            (r.cast_name && r.cast_name === castName) ||
            (r.uma_name && r.uma_name.replace('役', '').trim() === cleanUmaName)
        ));
        if (found) {
            mainColor = found.main_color;
            subColor = found.sub_color;
        }
    }

    if (mainColor) {
        const main = invertCharColor ? (subColor || mainColor) : mainColor;
        const sub = invertCharColor ? mainColor : subColor;
        const colors = getThemeColors(main, sub);
        bakenDOM.style.setProperty('--baken-bg-color', colors.bg);
        bakenDOM.style.setProperty('--baken-theme-color', colors.theme);
        bakenDOM.style.setProperty('--baken-watermark-color', colors.watermark);
    } else {
        bakenDOM.style.removeProperty('--baken-bg-color');
        bakenDOM.style.removeProperty('--baken-theme-color');
        bakenDOM.style.removeProperty('--baken-watermark-color');
    }
}

let currentTopView = 'event'; // 'event' or 'cart'

function updateCartExpandBtnVisibility() {
    const expandBtn = document.getElementById('cartExpandBtn');
    const cartItemsEl = document.getElementById('cartItems');
    if (!expandBtn || !cartItemsEl) return;

    if (currentTopView !== 'cart' || cartItems.length === 0) {
        expandBtn.style.display = 'none';
        return;
    }

    let isOverflowing = false;
    if (isCartExpanded) {
        // 展開中の場合は全高が 136px (折りたたみ時max-height) を超えているか判定
        isOverflowing = cartItemsEl.scrollHeight > 137;
        if (!isOverflowing) {
            isCartExpanded = false;
            cartItemsEl.classList.remove('is-expanded');
        }
    } else {
        // 折りたたみ時は scrollHeight が clientHeight より大きい場合にoverflowと判定
        isOverflowing = cartItemsEl.scrollHeight > cartItemsEl.clientHeight;
    }

    if (isOverflowing) {
        expandBtn.style.display = 'flex';
        const iconExpand = expandBtn.querySelector('.cart-expand-icon.expand');
        const iconCollapse = expandBtn.querySelector('.cart-expand-icon.collapse');
        if (isCartExpanded) {
            cartItemsEl.classList.add('is-expanded');
            if (iconExpand) iconExpand.style.display = 'none';
            if (iconCollapse) iconCollapse.style.display = 'block';
            expandBtn.title = '連勝候補リストを縮小';
        } else {
            cartItemsEl.classList.remove('is-expanded');
            if (iconExpand) iconExpand.style.display = 'block';
            if (iconCollapse) iconCollapse.style.display = 'none';
            expandBtn.title = '連勝候補リストを展開';
        }
    } else {
        expandBtn.style.display = 'none';
        isCartExpanded = false;
        cartItemsEl.classList.remove('is-expanded');
    }
}

function updateTopAreaView() {
    const switcher = document.getElementById('topInfoSwitcher');
    const eventArea = document.getElementById('eventSettingsArea');
    const cartArea = document.getElementById('cartArea');
    const toggleBtn = document.getElementById('toggleTopAreaBtn');

    if (!eventArea || !cartArea) return;

    const hasItems = cartItems.length > 0;

    if (switcher) {
        switcher.classList.toggle('has-multi-pages', hasItems);
    }

    if (toggleBtn) {
        toggleBtn.style.display = hasItems ? 'flex' : 'none';
    }

    if (currentTopView === 'cart' && hasItems) {
        eventArea.style.display = 'none';
        cartArea.style.display = 'flex';
        updateCartExpandBtnVisibility();

        const cartQtySpan = document.getElementById('cartQtySpan');
        if (cartQtySpan) {
            adjustQtyDisplayScale(cartQtySpan);
        }
        if (toggleBtn) {
            toggleBtn.title = '開催情報設定を表示';
        }
    } else {
        currentTopView = 'event';
        eventArea.style.display = 'flex';
        cartArea.style.display = 'none';
        updateCartExpandBtnVisibility();

        if (toggleBtn) {
            toggleBtn.title = '連勝候補リストを表示';
        }
    }
}

let currentCartBetType = 'umaren';
let isCartBetTypeUserModified = false;
let cartBetTypeDropdownObj = null;
let isCartExpanded = false;

function initCartBetTypeDropdown() {
    const container = document.getElementById('cartBetTypeContainer');
    if (!container || cartBetTypeDropdownObj) return;

    const cartBetTypeOptions = [
        { value: 'umaren', label: 'ウマ連' },
        { value: 'sanrenpuku', label: '3連複' },
        { value: 'umaren_box', label: 'ウマ連ボックス' },
        { value: 'sanrenpuku_box', label: '3連複ボックス' }
    ];

    cartBetTypeDropdownObj = createCustomDropdown({
        options: cartBetTypeOptions,
        initialValue: currentCartBetType,
        className: 'bet-type-dropdown cart-bet-type-dropdown',
        triggerClass: 'bet-type-trigger',
        onSelect: (selectedVal) => {
            currentCartBetType = selectedVal;
            isCartBetTypeUserModified = true;
            updateCartHelpNotes();
            updateCartIssueBtn();
        }
    });

    container.innerHTML = '';
    container.appendChild(cartBetTypeDropdownObj.element);
}

function renderCartItems() {
    const itemsDiv = document.getElementById('cartItems');
    if (!itemsDiv) return;

    itemsDiv.innerHTML = '';
    const mode = getDisplayMode();

    cartItems.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.dataset.index = index;

        const cleanName = (item.uma_name || '').replace('役', '').trim();
        const displayName = (mode === 'cast') ? item.cast_name : cleanName;
        const mainColor = item.main_color || '#333333';
        const subColor = item.sub_color || '#cccccc';
        const badgeStyle = `background: linear-gradient(135deg, ${mainColor} 75%, ${subColor} 25%);`;

        el.innerHTML = `<span class="cart-item-num" style="${badgeStyle}">${item.uma_number}</span><span class="cart-item-name">${displayName}</span><span class="cart-item-remove" data-index="${index}">×</span>`;

        const removeBtn = el.querySelector('.cart-item-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                cartItems.splice(index, 1);
                if (cartItems.length === 0) {
                    currentTopView = 'event';
                    isCartBetTypeUserModified = false;
                    currentCartBetType = 'umaren';
                    if (cartBetTypeDropdownObj && typeof cartBetTypeDropdownObj.setValue === 'function') {
                        cartBetTypeDropdownObj.setValue('umaren');
                    }
                }
                updateCartUI();
            });
        }

        itemsDiv.appendChild(el);
    });
}

function getBetSummary(betType, amount, count = 1) {
    let comboCount = 1;
    if (betType === 'ouen') {
        comboCount = 2;
    } else if (betType === 'umaren_box') {
        comboCount = (count >= 2) ? (count * (count - 1)) / 2 : 1;
    } else if (betType === 'sanrenpuku_box') {
        comboCount = (count >= 3) ? (count * (count - 1) * (count - 2)) / 6 : 1;
    } else {
        // tansho, umaren, sanrenpuku
        comboCount = 1;
    }
    const totalAmount = amount * comboCount;
    return { comboCount, totalAmount };
}

function updateCardIssueBtn(issueBtn, betType, amount) {
    if (!issueBtn) return;
    const summary = getBetSummary(betType, amount, 1);
    issueBtn.innerHTML = `
        <span class="issue-btn-label">発券</span>
        <span class="issue-btn-info">
            <span class="issue-btn-combos">${summary.comboCount} 点</span>
            <span class="issue-btn-total">合計 ${summary.totalAmount}</span>
        </span>
    `;
}

function updateCartIssueBtn() {
    const cartIssueBtn = document.getElementById('cartIssueBtn');
    if (!cartIssueBtn) return;
    const count = cartItems.length;
    const summary = getBetSummary(currentCartBetType, cartAmount, count);
    cartIssueBtn.innerHTML = `
        <span class="issue-btn-label">発券</span>
        <span class="issue-btn-info">
            <span class="issue-btn-combos">${summary.comboCount} 点</span>
            <span class="issue-btn-total">合計 ${summary.totalAmount}</span>
        </span>
    `;
}

function updateCartUI() {
    initCartBetTypeDropdown();

    const cartRight = document.getElementById('cartRight');
    const cartMinusBtn = document.getElementById('cartMinusBtn');
    const cartPlusBtn = document.getElementById('cartPlusBtn');
    const cartIssueBtn = document.getElementById('cartIssueBtn');

    if (cartItems.length > 0) {
        cartRight.style.display = 'flex';
    } else {
        cartRight.style.display = 'none';
        isCartBetTypeUserModified = false;
        currentCartBetType = 'umaren';
        if (cartBetTypeDropdownObj && typeof cartBetTypeDropdownObj.setValue === 'function') {
            cartBetTypeDropdownObj.setValue('umaren');
        }
    }

    updateTopAreaView();
    renderCartItems();

    const isReady = cartItems.length >= 2;
    const count = cartItems.length;

    const cartCountBadge = document.getElementById('cartCountBadge');
    if (cartCountBadge) {
        cartCountBadge.textContent = ` (${count}/8)`;
    }

    // 展開/折りたたみボタンの表示更新（overflow時のみ表示）
    updateCartExpandBtnVisibility();
    requestAnimationFrame(updateCartExpandBtnVisibility);

    if (cartBetTypeDropdownObj) {
        if (count <= 1) {
            cartBetTypeDropdownObj.setDisabled(true);
            cartBetTypeDropdownObj.setDisabledOptions(['umaren', 'sanrenpuku', 'umaren_box', 'sanrenpuku_box']);
            if (!isCartBetTypeUserModified) {
                currentCartBetType = 'umaren';
                cartBetTypeDropdownObj.setValue('umaren');
            }
        } else if (count === 2) {
            cartBetTypeDropdownObj.setDisabled(false);
            cartBetTypeDropdownObj.setDisabledOptions(['sanrenpuku', 'umaren_box', 'sanrenpuku_box']);
            if (!isCartBetTypeUserModified || currentCartBetType !== 'umaren') {
                currentCartBetType = 'umaren';
                cartBetTypeDropdownObj.setValue('umaren');
            }
        } else if (count === 3) {
            cartBetTypeDropdownObj.setDisabled(false);
            cartBetTypeDropdownObj.setDisabledOptions(['umaren', 'sanrenpuku_box']);
            if (!isCartBetTypeUserModified) {
                currentCartBetType = 'sanrenpuku';
                cartBetTypeDropdownObj.setValue('sanrenpuku');
            } else if (currentCartBetType === 'umaren' || currentCartBetType === 'sanrenpuku_box') {
                currentCartBetType = 'sanrenpuku';
                cartBetTypeDropdownObj.setValue('sanrenpuku');
            }
        } else {
            cartBetTypeDropdownObj.setDisabled(false);
            cartBetTypeDropdownObj.setDisabledOptions(['umaren', 'sanrenpuku']);
            if (!isCartBetTypeUserModified) {
                currentCartBetType = 'sanrenpuku_box';
                cartBetTypeDropdownObj.setValue('sanrenpuku_box');
            } else if (currentCartBetType === 'umaren' || currentCartBetType === 'sanrenpuku') {
                currentCartBetType = 'sanrenpuku_box';
                cartBetTypeDropdownObj.setValue('sanrenpuku_box');
            }
        }
    }

    updateCartHelpNotes();

    cartPlusBtn.disabled = !isReady;
    cartIssueBtn.disabled = !isReady;
    cartMinusBtn.disabled = !isReady || cartAmount <= 100;

    const cartQtySpan = document.getElementById('cartQtySpan');
    if (cartQtySpan) {
        cartQtySpan.textContent = cartAmount;
        adjustQtyDisplayScale(cartQtySpan);
    }

    updateCartIssueBtn();

    document.querySelectorAll('.item-card').forEach(card => {
        const castName = card.dataset.castName;
        if (cartItems.some(item => item.cast_name === castName)) {
            card.classList.add('checked-row');
        } else {
            card.classList.remove('checked-row');
        }
    });
}

function makeCartNumbersSequential() {
    if (cartItems.length === 0) return;

    const startNum = parseInt(cartItems[0].uma_number, 10) || 1;

    cartItems.forEach((item, idx) => {
        const newNum = String(startNum + idx);
        item.uma_number = newNum;

        const key = item.cast_name ? `${item.uma_name}_${item.cast_name}` : item.uma_name;
        umaNumbers[key] = newNum;
    });

    document.querySelectorAll('.item-card').forEach(card => {
        const castName = card.dataset.castName;
        const matchedItem = cartItems.find(item => item.cast_name === castName);
        if (matchedItem) {
            const dropdown = card.querySelector('.uma-number-dropdown');
            if (dropdown && typeof dropdown.setCustomValue === 'function') {
                dropdown.setCustomValue(matchedItem.uma_number);
            }
        }
    });

    updateCartUI();
    showToast('ウマ番を連番に設定しました');
}

function updateCartHelpNotes() {
    const bottomDiv = document.getElementById('cartBottom');
    if (!bottomDiv) return;
    bottomDiv.innerHTML = '';

    if (cartItems.length === 0) return;

    const isBox = (currentCartBetType === 'umaren_box' || currentCartBetType === 'sanrenpuku_box');

    // 1. 重複ウマ番チェック
    const numbers = cartItems.map(item => String(item.uma_number));
    const hasDuplicateNumbers = numbers.some((num, idx) => numbers.indexOf(num) !== idx);

    if (hasDuplicateNumbers) {
        const dupNote = document.createElement('p');
        dupNote.className = 'cart-help-note warning';
        dupNote.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>同じウマ番が存在します（<a href="#" id="cartSequentialBtn" class="cart-help-action">連番にする</a>）</span>
        `;

        const seqBtn = dupNote.querySelector('#cartSequentialBtn');
        if (seqBtn) {
            seqBtn.addEventListener('click', (e) => {
                e.preventDefault();
                makeCartNumbersSequential();
            });
        }
        bottomDiv.appendChild(dupNote);
    }

    // 2. ボックス時のサブ名称非表示ノート
    if (isBox) {
        const boxNote = document.createElement('p');
        boxNote.className = 'cart-help-note';
        boxNote.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>ボックスではサブ名称が表示されません。</span>
        `;
        bottomDiv.appendChild(boxNote);
    }
}

function addToCart(rowData) {
    if (cartItems.length >= 8) {
        showToast('追加できるのは8人までです');
        return;
    }

    if (cartItems.some(item => item.cast_name === rowData.cast_name)) {
        showToast('既に追加されています');
        return;
    }

    if (cartItems.length === 0) {
        const key = rowData.uma_name;
        if (ticketAmounts[key]) {
            cartAmount = ticketAmounts[key];
        }
    }

    cartItems.push(rowData);
    currentTopView = 'cart';
    updateCartUI();
}

let toastTimeout;
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
}

let rapidClickCount = 0;
let lastClickTime = 0;
let hasShownLongPressHint = false;

function checkRapidClick() {
    if (hasShownLongPressHint) return;

    const now = Date.now();
    if (now - lastClickTime < 500) {
        rapidClickCount++;
        if (rapidClickCount >= 10) {
            showToast('ボタンを長押しすると素早く増減できます', 4000);
            hasShownLongPressHint = true;
        }
    } else {
        rapidClickCount = 1;
    }
    lastClickTime = now;
}

function setupLongPress(btn, action) {
    let timer;
    let currentDelay;
    let isPressing = false;

    const startPress = (e) => {
        if (e.type === 'touchstart') e.preventDefault();
        if (btn.disabled || isPressing) return;

        const activeInput = document.querySelector('.qty-display input');
        if (activeInput) {
            activeInput.blur();
        }

        isPressing = true;
        checkRapidClick();
        action();

        currentDelay = 250;
        timer = setTimeout(repeat, 500);
    };

    const repeat = () => {
        action();
        currentDelay = Math.max(20, currentDelay * 0.85);
        timer = setTimeout(repeat, currentDelay);
    };

    const stopPress = () => {
        isPressing = false;
        clearTimeout(timer);
    };

    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', stopPress);
    btn.addEventListener('mouseleave', stopPress);
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', stopPress);
    btn.addEventListener('touchcancel', stopPress);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

const MAX_BAKEN_QTY = 99999900;

function adjustQtyDisplayScale(el) {
    if (!el) return;
    if (el.classList.contains('editing')) {
        el.style.transform = '';
        return;
    }
    el.style.transform = '';
    const text = el.textContent.trim();
    const len = text.length;

    let scale = 1;
    if (len === 7) {
        scale = 0.82;
    } else if (len >= 8) {
        scale = 0.72;
    }

    if (scale < 1) {
        el.innerHTML = `<span class="qty-text" style="transform: scaleX(${scale});">${text}</span>`;
    } else {
        el.innerHTML = `<span class="qty-text">${text}</span>`;
    }
}

function updateBkValScaling(totalAmount) {
    const bkValEl = document.getElementById('bkVal');
    const bkTotalValEl = document.getElementById('bkTotalVal');
    if (!bkValEl || !bkTotalValEl) return;

    if (totalAmount && totalAmount.toString().length >= 9) {
        bkValEl.classList.add('scale-8-9');
        bkValEl.style.display = 'inline-block';
        bkValEl.style.transform = 'scaleX(0.8888)';
        bkValEl.style.transformOrigin = 'center';
        bkValEl.style.letterSpacing = '0px';

        bkTotalValEl.classList.add('scale-8-9');
        bkTotalValEl.style.display = 'inline-block';
        bkTotalValEl.style.transform = 'scaleX(0.8888)';
        bkTotalValEl.style.transformOrigin = 'center';
        bkTotalValEl.style.letterSpacing = '0px';
    } else {
        bkValEl.classList.remove('scale-8-9');
        bkValEl.style.display = '';
        bkValEl.style.transform = '';
        bkValEl.style.transformOrigin = '';
        bkValEl.style.letterSpacing = '';

        bkTotalValEl.classList.remove('scale-8-9');
        bkTotalValEl.style.display = '';
        bkTotalValEl.style.transform = '';
        bkTotalValEl.style.transformOrigin = '';
        bkTotalValEl.style.letterSpacing = '';
    }
}

function setupQtyDisplayEdit(qtySpan, getCurrentVal, onUpdateVal) {
    qtySpan.addEventListener('click', () => {
        if (qtySpan.querySelector('input')) return;

        // 編集開始前のスクロール位置を保持（スマートフォン対応）
        const prevScrollX = window.scrollX || window.pageXOffset || 0;
        const prevScrollY = window.scrollY || window.pageYOffset || 0;

        const currentVal = getCurrentVal();
        let displayVal = Math.max(1, Math.floor(currentVal / 100));
        if (displayVal > 999999) displayVal = 999999;
        const initialStr = displayVal.toString();

        const editContainer = document.createElement('div');
        editContainer.className = 'qty-edit-container';

        const prefixSpan = document.createElement('span');
        prefixSpan.className = 'qty-zero-prefix';

        const input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        input.setAttribute('maxlength', '6');
        input.value = initialStr;
        input.className = 'qty-edit-input';

        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'qty-zero-suffix';
        suffixSpan.textContent = '00';

        const updateEditPadding = () => {
            let numStr = input.value.replace(/[^0-9]/g, '');
            if (numStr.length > 6) {
                numStr = numStr.slice(0, 6);
            }
            input.value = numStr;
            const len = numStr.length;
            if (len === 0) {
                prefixSpan.textContent = '00000';
                input.placeholder = '0';
                input.style.width = '1ch';
            } else {
                prefixSpan.textContent = '0'.repeat(Math.max(0, 6 - len));
                input.placeholder = '';
                input.style.width = `${len}ch`;
            }
        };

        updateEditPadding();
        input.addEventListener('input', updateEditPadding);

        const wrapper = qtySpan.closest('.amount-control-wrapper');
        let mainBtns = [];
        let qtySubRow = null;
        let confirmBtn = null;

        if (wrapper) {
            mainBtns = wrapper.querySelectorAll('.qty-main-row .qty-btn');
            mainBtns.forEach(btn => btn.style.display = 'none');
            qtySubRow = wrapper.querySelector('.qty-sub-row');
            if (qtySubRow) {
                Array.from(qtySubRow.children).forEach(child => child.style.display = 'none');
                confirmBtn = document.createElement('button');
                confirmBtn.className = 'qty-btn-small';
                confirmBtn.style.width = '100%';
                confirmBtn.textContent = '確定';
                confirmBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    input.blur();
                });
                qtySubRow.appendChild(confirmBtn);
            }
        }

        qtySpan.classList.add('editing');
        qtySpan.textContent = '';
        qtySpan.style.transform = '';

        editContainer.appendChild(prefixSpan);
        editContainer.appendChild(input);
        editContainer.appendChild(suffixSpan);
        qtySpan.appendChild(editContainer);

        input.style.width = `${Math.max(1, initialStr.length)}ch`;

        input.focus();
        input.select();

        let isFinished = false;
        const finishEdit = () => {
            if (isFinished) return;
            isFinished = true;

            qtySpan.classList.remove('editing');

            if (wrapper) {
                mainBtns.forEach(btn => btn.style.display = '');
                if (qtySubRow) {
                    if (confirmBtn && confirmBtn.parentNode === qtySubRow) {
                        qtySubRow.removeChild(confirmBtn);
                    }
                    Array.from(qtySubRow.children).forEach(child => child.style.display = '');
                }
            }

            let raw = parseInt(input.value, 10);
            let units = (isNaN(raw) || raw < 1) ? 1 : raw;
            let val = units * 100;
            if (val > MAX_BAKEN_QTY) {
                val = MAX_BAKEN_QTY;
            }
            qtySpan.textContent = val;
            adjustQtyDisplayScale(qtySpan);
            onUpdateVal(val);

            // ソフトウェアキーボードが閉じた後に元のスクロール位置へ復元
            const restoreScroll = () => {
                window.scrollTo(prevScrollX, prevScrollY);
            };
            restoreScroll();
            setTimeout(restoreScroll, 50);
            setTimeout(restoreScroll, 150);
            setTimeout(restoreScroll, 300);
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                input.blur();
            }
        });
    });
}

function hiraganaToKatakana(str) {
    return str.replace(/[\u3041-\u3096]/g, function (match) {
        const chr = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(chr);
    });
}

function katakanaToHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, function (match) {
        const chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
    });
}

function getMatches(keyword) {
    if (!keyword) return [];
    const katakanaKeyword = hiraganaToKatakana(keyword);
    const hiraganaKeyword = katakanaToHiragana(keyword);

    const matchesMap = new Map();

    for (const row of allUmaData) {
        const castName = (row.cast_name || '').trim();
        const umaName = (row.uma_name || '').replace('役', '').trim();
        const castKana = (row.cast_name_kana || '').trim();

        // キャスト名でのマッチ判定
        const castMatched = castName.toLowerCase().includes(keyword) ||
            (castKana && (castKana.toLowerCase().includes(keyword) || castKana.toLowerCase().includes(hiraganaKeyword)));

        if (castMatched && castName) {
            const key = `cast_${castName}`;
            if (!matchesMap.has(key)) {
                matchesMap.set(key, {
                    type: 'cast',
                    value: castName,
                    subValue: umaName
                });
            }
        }

        // キャラ名でのマッチ判定
        const umaLower = umaName.toLowerCase();
        const isKatakana = /^[ァ-ヶー・ 　]+$/.test(umaName);
        let umaMatched = false;
        if (isKatakana) {
            umaMatched = umaLower.includes(keyword) || umaLower.includes(katakanaKeyword);
        } else {
            umaMatched = umaLower.includes(keyword);
        }

        if (umaMatched && umaName) {
            const key = `uma_${umaName}`;
            if (!matchesMap.has(key)) {
                const matchingCasts = allUmaData
                    .filter(r => (r.uma_name || '').replace('役', '').trim() === umaName && r.cast_name && r.cast_name.trim() !== '')
                    .map(r => r.cast_name.trim());
                const uniqueCasts = Array.from(new Set(matchingCasts));
                const castDisplay = uniqueCasts.join('・');

                matchesMap.set(key, {
                    type: 'uma',
                    value: umaName,
                    subValue: castDisplay
                });
            }
        }

        // タグでのマッチ判定
        if (row.tags && row.tags.trim()) {
            const tagsArray = row.tags.split(/\s+/).filter(t => t.trim() !== '');
            tagsArray.forEach(tag => {
                let displayTag = tag;
                if (!displayTag.startsWith('#')) {
                    displayTag = '#' + displayTag;
                }
                const cleanTag = displayTag.replace(/#/g, '').toLowerCase();
                const cleanKeyword = keyword.replace(/#/g, '').toLowerCase();

                if (cleanTag.includes(cleanKeyword)) {
                    const key = `tag_${displayTag}`;
                    if (!matchesMap.has(key)) {
                        matchesMap.set(key, {
                            type: 'tag',
                            value: displayTag,
                            subValue: 'タグ検索'
                        });
                    }
                }
            });
        }
    }

    return Array.from(matchesMap.values()).slice(0, 3);
}

const searchInput = document.getElementById('searchInput');
const clearInputBtn = document.getElementById('clearInputBtn');
const suggestionsBox = document.getElementById('suggestionsBox');

Papa.parse(umaCsvPath, {
    download: true, header: true, skipEmptyLines: true,
    complete: function (results) {
        allUmaData = results.data;

        applyFilters();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('itemList').style.display = 'grid';
    },
    error: function (err) {
        document.getElementById('loading').innerText = 'データの読み込みに失敗しました';
    }
});

function applyFilters() {
    const keyword = searchInput.value.toLowerCase().trim();
    const katakanaKeyword = hiraganaToKatakana(keyword);
    const hiraganaKeyword = katakanaToHiragana(keyword);

    const filteredData = allUmaData.filter(row => {
        if (keyword) {
            const cast = (row.cast_name || '').toLowerCase();
            const castKana = (row.cast_name_kana || '').toLowerCase();
            const uma = (row.uma_name || '').toLowerCase();
            const tags = (row.tags || '').toLowerCase();

            const cleanKeyword = keyword.replace(/#/g, '');
            const cleanTags = tags.replace(/#/g, '');

            return cast.includes(keyword) ||
                castKana.includes(keyword) ||
                castKana.includes(hiraganaKeyword) ||
                uma.includes(keyword) ||
                uma.includes(katakanaKeyword) ||
                tags.includes(keyword) ||
                cleanTags.includes(cleanKeyword);
        }
        return true;
    });
    renderList(filteredData);
}

searchInput.addEventListener('input', function (e) {
    const keyword = e.target.value.toLowerCase().trim();
    clearInputBtn.style.display = keyword ? 'block' : 'none';
    applyFilters();
    showSuggestions(keyword);
});

searchInput.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        const keyword = searchInput.value.toLowerCase().trim();
        const matches = getMatches(keyword);
        if (matches.length === 1) {
            selectSuggestion(matches[0].value);
        } else {
            suggestionsBox.innerHTML = '';
        }
        searchInput.blur();
    }
});

clearInputBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearInputBtn.style.display = 'none';
    suggestionsBox.innerHTML = '';
    applyFilters();
    searchInput.focus();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) suggestionsBox.innerHTML = '';
});

function selectSuggestion(match) {
    searchInput.value = match;
    clearInputBtn.style.display = 'block';
    suggestionsBox.innerHTML = '';
    applyFilters();
}

function showSuggestions(keyword) {
    suggestionsBox.innerHTML = '';
    if (!keyword) return;

    const matches = getMatches(keyword);
    if (matches.length === 0) return;

    matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <span class="suggestion-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg></span>
                        ${match.value}
                    </div>
                    <span class="suggestion-sub-value" style="font-size: 0.8rem; color: #888; white-space: nowrap; margin-left: 10px;">${match.subValue}</span>
                `;
        div.addEventListener('click', () => {
            selectSuggestion(match.value);
        });
        suggestionsBox.appendChild(div);
    });
}

function getDisplayMode() {
    return document.body.getAttribute('data-display-mode') || 'cast';
}

function setDisplayMode(mode) {
    if (getDisplayMode() === mode) return;
    document.body.setAttribute('data-display-mode', mode);
    updateCartUI();
    if (typeof renderHistoryList === 'function') renderHistoryList();
    if (currentGeneratingTicketParams) {
        const { data, amount, betType } = currentGeneratingTicketParams;
        generateTicket(data, amount, betType, true);
    }
    const modeName = (mode === 'cast') ? 'キャスト名優先' : 'キャラ名優先';
    showToast(`${modeName}モードに切り替えました`);
}

function scrollActiveItemToCenter(menu) {
    if (!menu) return;
    const activeItem = menu.querySelector('.dropdown-item.active');
    if (activeItem) {
        requestAnimationFrame(() => {
            const targetScrollTop = activeItem.offsetTop - (menu.clientHeight / 2) + (activeItem.clientHeight / 2);
            menu.scrollTop = targetScrollTop;
        });
    }
}

function createCustomDropdown({ options, initialValue, onSelect, className = '', triggerClass = '' }) {
    const dropdown = document.createElement('div');
    dropdown.className = `custom-dropdown ${className}`.trim();

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = `dropdown-trigger ${triggerClass}`.trim();
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const textSpan = document.createElement('span');
    textSpan.className = 'dropdown-selected-text';

    const currentOpt = options.find(o => o.value === initialValue) || options[0];
    textSpan.textContent = currentOpt ? currentOpt.label : initialValue;

    const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevronSvg.setAttribute('class', 'dropdown-chevron');
    chevronSvg.setAttribute('viewBox', '0 0 24 24');
    chevronSvg.setAttribute('width', className.includes('uma-number') ? '12' : '16');
    chevronSvg.setAttribute('height', className.includes('uma-number') ? '12' : '16');
    chevronSvg.setAttribute('fill', 'none');
    chevronSvg.setAttribute('stroke', 'currentColor');
    chevronSvg.setAttribute('stroke-width', className.includes('uma-number') ? '3' : '2');
    chevronSvg.setAttribute('stroke-linecap', 'round');
    chevronSvg.setAttribute('stroke-linejoin', 'round');
    chevronSvg.innerHTML = '<path d="M6 9l6 6 6-6"/>';

    trigger.appendChild(textSpan);
    trigger.appendChild(chevronSvg);
    dropdown.appendChild(trigger);

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.setAttribute('role', 'listbox');

    options.forEach(opt => {
        if (opt.divider) {
            const divider = document.createElement('div');
            divider.className = 'dropdown-divider';
            menu.appendChild(divider);
            return;
        }

        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'dropdown-item';
        if (opt.isAction) item.classList.add('dropdown-item-action');
        item.dataset.value = opt.value;
        item.textContent = opt.label;
        if (opt.value === initialValue) item.classList.add('active');

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = opt.value;
            if (!opt.isAction) {
                textSpan.textContent = opt.label;
                menu.querySelectorAll('.dropdown-item').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === val);
                });
            }
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            if (onSelect) onSelect(val, item, dropdown, textSpan);
        });

        menu.appendChild(item);
    });

    dropdown.appendChild(menu);

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('open');
                d.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
            }
        });
        dropdown.classList.toggle('open', !isOpen);
        trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        if (!isOpen) {
            scrollActiveItemToCenter(menu);
        }
    });

    const setValFn = (val, label) => {
        const opt = options.find(o => o.value === val);
        textSpan.textContent = label || (opt ? opt.label : val);
        menu.querySelectorAll('.dropdown-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === val);
        });
    };
    dropdown.setCustomValue = setValFn;

    return {
        element: dropdown,
        setValue: setValFn,
        getValue: () => {
            const activeItem = menu.querySelector('.dropdown-item.active');
            return activeItem ? activeItem.dataset.value : initialValue;
        },
        setDisabled: (disabled) => {
            trigger.disabled = !!disabled;
            dropdown.classList.toggle('disabled', !!disabled);
            if (disabled) {
                dropdown.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            }
        },
        setDisabledOptions: (disabledValues = []) => {
            menu.querySelectorAll('.dropdown-item').forEach(btn => {
                const val = btn.dataset.value;
                const isDisabled = disabledValues.includes(val);
                btn.disabled = isDisabled;
                btn.classList.toggle('disabled', isDisabled);
            });
        }
    };
}

function changeAllTicketTypes(targetType) {
    Object.keys(ticketTypes).forEach(k => {
        ticketTypes[k] = targetType;
    });

    allUmaData.forEach(row => {
        const k = row.cast_name ? `${row.uma_name}_${row.cast_name}` : row.uma_name;
        ticketTypes[k] = targetType;
    });

    const label = (targetType === 'ouen') ? '応援バ券 (単+複)' : '単勝';
    document.querySelectorAll('.item-card .bet-type-dropdown').forEach(dropdown => {
        const textSpan = dropdown.querySelector('.dropdown-selected-text');
        if (textSpan) textSpan.textContent = label;
        dropdown.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
            if (item.dataset.value === targetType) {
                item.classList.add('active');
            } else if (item.dataset.value === 'ouen' || item.dataset.value === 'tansho') {
                item.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.item-card').forEach(card => {
        const key = card.dataset.castName ? `${card.dataset.umaName}_${card.dataset.castName}` : card.dataset.umaName;
        const issueBtn = card.querySelector('.issue-btn');
        if (issueBtn) {
            updateCardIssueBtn(issueBtn, targetType, ticketAmounts[key] || 100);
        }
    });

    showToast(targetType === 'ouen' ? 'すべての券種を「応援バ券 (単+複)」に変更しました' : 'すべての券種を「単勝」に変更しました');
}

function renderList(data) {
    const listContainer = document.getElementById('itemList');
    listContainer.innerHTML = '';
    if (data.length === 0) {
        listContainer.innerHTML = `<div class="empty-list-message">該当するキャラクターがいません</div>`;
        return;
    }

    data.forEach((row, index) => {
        const key = row.cast_name ? `${row.uma_name}_${row.cast_name}` : row.uma_name;

        if (!ticketAmounts[key]) ticketAmounts[key] = 100;
        if (!ticketTypes[key]) ticketTypes[key] = 'ouen';
        if (!umaNumbers[key]) umaNumbers[key] = row.uma_number || 1;

        const cleanUmaName = (row.uma_name || '').replace('役', '').trim();
        const mainColor = row.main_color || '#333333';
        const subColor = row.sub_color || '#cccccc';
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.castName = row.cast_name;
        const themeColors = getThemeColors(mainColor, subColor);
        card.style.setProperty('--card-active-bg', themeColors.cardBg);
        card.style.setProperty('--card-active-border', mainColor);
        card.style.setProperty('--card-stripe', `linear-gradient(135deg, ${mainColor} 75%, ${subColor} 25%)`);

        if (cartItems.some(item => item.cast_name === row.cast_name)) {
            card.classList.add('checked-row');
        }

        const checkBtn = document.createElement('button');
        checkBtn.type = 'button';
        checkBtn.className = 'card-checked-badge';
        checkBtn.setAttribute('aria-label', '連勝候補から削除');
        checkBtn.setAttribute('title', '連勝候補から削除');
        checkBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        `;
        checkBtn.style.backgroundColor = mainColor;
        checkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = cartItems.findIndex(item => item.cast_name === row.cast_name);
            if (idx !== -1) {
                cartItems.splice(idx, 1);
                if (cartItems.length === 0) {
                    currentTopView = 'event';
                    isCartBetTypeUserModified = false;
                    currentCartBetType = 'umaren';
                    if (cartBetTypeDropdownObj && typeof cartBetTypeDropdownObj.setValue === 'function') {
                        cartBetTypeDropdownObj.setValue('umaren');
                    }
                }
                updateCartUI();
            }
        });
        card.appendChild(checkBtn);

        const leftDiv = document.createElement('div');
        leftDiv.className = 'card-left';

        const infoTopDiv = document.createElement('div');
        infoTopDiv.className = 'card-info-top';

        // 1行目: 馬番ドロップダウン & 切り替えボタン
        const actionsRow = document.createElement('div');
        actionsRow.className = 'card-info-actions';

        const numOptions = [];
        for (let i = 1; i <= 32; i++) {
            numOptions.push({ value: String(i), label: String(i) });
        }

        const numberDropdownObj = createCustomDropdown({
            options: numOptions,
            initialValue: String(umaNumbers[key]),
            className: 'uma-number-dropdown',
            triggerClass: 'uma-number-trigger',
            onSelect: (newNum) => {
                umaNumbers[key] = newNum;
                cartItems.forEach(item => {
                    if (item.cast_name === row.cast_name) {
                        item.uma_number = newNum;
                    }
                });
                updateCartUI();
            }
        });
        actionsRow.appendChild(numberDropdownObj.element);

        const modeSwitchBtn = document.createElement('button');
        modeSwitchBtn.type = 'button';
        modeSwitchBtn.className = 'mode-switch-btn';
        modeSwitchBtn.setAttribute('aria-label', 'キャラ名/キャスト名切り替え');
        modeSwitchBtn.setAttribute('title', 'キャラ名/キャスト名切り替え');
        modeSwitchBtn.innerHTML = `
            <svg class="mode-icon-user" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            <svg class="mode-icon-switch" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <polyline points="3 3 3 8 8 8" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <polyline points="21 21 21 16 16 16" />
            </svg>
            <svg class="mode-icon-carrot" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
                <path d="M7 9c-1 3 0 7 5 13 5-6 6-10 5-13-1-2-3-2.5-5-2.5S8 7 7 9z" />
                <path d="M12 6.5C12 3 10 2 9 2" />
                <path d="M12 6.5C12 3 14 2 15 2" />
                <path d="M12 6.5V2" />
                <path d="M9.5 12h3" />
                <path d="M11 16h2.5" />
            </svg>
        `;
        modeSwitchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentMode = document.body.getAttribute('data-display-mode') || 'uma';
            const nextMode = (currentMode === 'uma') ? 'cast' : 'uma';
            setDisplayMode(nextMode);
        });
        actionsRow.appendChild(modeSwitchBtn);

        // 2行目: メイン名（キャラ名 または キャスト名）
        const mainNameDiv = document.createElement('div');
        mainNameDiv.className = 'card-info-main-name';

        const umaMainSpan = document.createElement('span');
        umaMainSpan.className = 'card-name-uma-main';
        umaMainSpan.textContent = cleanUmaName;

        const castMainSpan = document.createElement('span');
        castMainSpan.className = 'card-name-cast-main';
        castMainSpan.textContent = row.cast_name;

        mainNameDiv.appendChild(umaMainSpan);
        mainNameDiv.appendChild(castMainSpan);

        // 3行目: サブ名（CV: キャスト名 または キャラ名役）
        const subNameDiv = document.createElement('div');
        subNameDiv.className = 'card-info-sub-name';

        const castSubSpan = document.createElement('span');
        castSubSpan.className = 'card-name-cast-sub';
        castSubSpan.textContent = `CV: ${row.cast_name}`;

        const umaSubSpan = document.createElement('span');
        umaSubSpan.className = 'card-name-uma-sub';
        umaSubSpan.textContent = `${cleanUmaName}役`;

        subNameDiv.appendChild(castSubSpan);
        subNameDiv.appendChild(umaSubSpan);

        infoTopDiv.appendChild(actionsRow);
        infoTopDiv.appendChild(mainNameDiv);
        infoTopDiv.appendChild(subNameDiv);

        const hasTags = row.tags && row.tags.trim();
        const hasNote = row.note && row.note.trim();

        if (hasTags || hasNote) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'uma-meta-group';

            if (hasNote) {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'uma-note';
                noteDiv.textContent = row.note;
                metaDiv.appendChild(noteDiv);
            }

            if (hasTags) {
                const tagsWrapper = document.createElement('div');
                tagsWrapper.className = 'tags-wrapper';
                const tagsArray = row.tags.split(/\s+/).filter(t => t.trim() !== '');
                tagsArray.forEach(tag => {
                    let displayTag = tag;
                    if (!displayTag.startsWith('#')) {
                        displayTag = '#' + displayTag;
                    }
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tag-badge';
                    tagSpan.textContent = displayTag;
                    tagSpan.addEventListener('click', (e) => {
                        e.stopPropagation();
                        searchInput.value = displayTag;
                        clearInputBtn.style.display = 'block';
                        applyFilters();
                        suggestionsBox.innerHTML = '';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                    tagsWrapper.appendChild(tagSpan);
                });
                metaDiv.appendChild(tagsWrapper);
            }

            infoTopDiv.appendChild(metaDiv);
        }

        const getTicketData = () => {
            return { ...row, uma_number: umaNumbers[key] };
        };

        const addCartLink = document.createElement('div');
        addCartLink.className = 'add-cart-link';
        addCartLink.innerHTML = `＋ 連勝候補に追加`;
        addCartLink.style.alignSelf = 'flex-start';
        addCartLink.style.width = 'fit-content';
        addCartLink.style.display = 'inline-block';
        addCartLink.addEventListener('click', () => addToCart(getTicketData()));

        leftDiv.style.display = 'flex';
        leftDiv.style.flexDirection = 'column';
        leftDiv.style.justifyContent = 'space-between';
        leftDiv.style.height = '100%';
        leftDiv.style.alignItems = 'flex-start';
        infoTopDiv.style.width = '100%';

        leftDiv.appendChild(infoTopDiv);
        leftDiv.appendChild(addCartLink);

        card.appendChild(leftDiv);

        const rightDiv = document.createElement('div');
        rightDiv.className = 'card-right';

        const amountControl = document.createElement('div');
        amountControl.className = 'amount-control-wrapper';

        const qtyMainRow = document.createElement('div');
        qtyMainRow.className = 'qty-main-row';

        const minusBtn = document.createElement('button');
        minusBtn.className = 'qty-btn'; minusBtn.textContent = '−';
        const qtySpan = document.createElement('span');
        qtySpan.className = 'qty-display'; qtySpan.textContent = ticketAmounts[key];
        adjustQtyDisplayScale(qtySpan);
        const plusBtn = document.createElement('button');
        plusBtn.className = 'qty-btn'; plusBtn.textContent = '＋';

        setupQtyDisplayEdit(qtySpan, () => ticketAmounts[key], (newVal) => updateQty(newVal));

        const updateQty = (newAmount) => {
            if (newAmount < 100) newAmount = 100;
            if (newAmount > MAX_BAKEN_QTY) {
                newAmount = MAX_BAKEN_QTY;
            }
            ticketAmounts[key] = newAmount;
            qtySpan.textContent = newAmount;
            adjustQtyDisplayScale(qtySpan);
            minusBtn.disabled = newAmount <= 100;
            plusBtn.disabled = newAmount >= MAX_BAKEN_QTY;
            updateCardIssueBtn(issueBtn, ticketTypes[key], newAmount);
        };
        minusBtn.disabled = ticketAmounts[key] <= 100;
        plusBtn.disabled = ticketAmounts[key] >= MAX_BAKEN_QTY;

        setupLongPress(minusBtn, () => updateQty(ticketAmounts[key] - 100));
        setupLongPress(plusBtn, () => updateQty(ticketAmounts[key] + 100));

        qtyMainRow.appendChild(minusBtn);
        qtyMainRow.appendChild(qtySpan);
        qtyMainRow.appendChild(plusBtn);

        const issueBtn = document.createElement('button');
        issueBtn.className = 'issue-btn';
        updateCardIssueBtn(issueBtn, ticketTypes[key], ticketAmounts[key]);
        issueBtn.addEventListener('click', () => generateTicket(getTicketData(), ticketAmounts[key], ticketTypes[key]));

        const betTypeOptions = [
            { value: 'ouen', label: '応援バ券 (単+複)' },
            { value: 'tansho', label: '単勝' },
            { divider: true },
            { value: 'all_ouen', label: 'すべて応援バ券に変更', isAction: true },
            { value: 'all_tansho', label: 'すべて単勝に変更', isAction: true }
        ];

        const betTypeDropdownObj = createCustomDropdown({
            options: betTypeOptions,
            initialValue: ticketTypes[key],
            className: 'bet-type-dropdown',
            triggerClass: 'bet-type-trigger',
            onSelect: (selectedVal) => {
                if (selectedVal === 'all_ouen') {
                    changeAllTicketTypes('ouen');
                } else if (selectedVal === 'all_tansho') {
                    changeAllTicketTypes('tansho');
                } else {
                    ticketTypes[key] = selectedVal;
                    updateCardIssueBtn(issueBtn, selectedVal, ticketAmounts[key]);
                }
            }
        });

        amountControl.appendChild(betTypeDropdownObj.element);
        amountControl.appendChild(qtyMainRow);

        rightDiv.appendChild(amountControl);
        rightDiv.appendChild(issueBtn);
        card.appendChild(rightDiv);

        listContainer.appendChild(card);
    });
}

function getScaleVar(text, threshold = 6, baseScale = 1) {
    const len = text.length;
    const ratio = len > threshold ? (threshold / len) : 1;
    return ratio * baseScale;
}

const shareModal = document.getElementById('shareModal');
const shareImagePreview = document.getElementById('shareImagePreview');
const shareImageLoading = document.getElementById('shareImageLoading');

function formatBakenRaceName(name) {
    if (name === "日本ダービー（東京優駿）") return "日本ダービー<br>(東京優駿)";
    if (name === "サウジアラビアロイヤルカップ") return "サウジアラビア<br>ロイヤルカップ";
    if (name === "朝日杯フューチュリティステークス") return "朝日杯<br>フューチュリティS";
    if (name === "阪神ジュベナイルフィリーズ") return "阪神ジュベナイル<br>フィリーズ";
    if (name === "マイルチャンピオンシップ南部杯") return "マイルチャンピオン<br>シップ南部杯";
    if (name === "マイルチャンピオンシップ") return "マイル<br>チャンピオンシップ";

    if (name.length < 10) return name;

    const suffixes = ["ステークス", "カップ", "トロフィー", "ダービー", "ハンデキャップ", "クラシック", "シリーズ", "リーグ"];
    let matchedSuffix = "";
    let prefix = name;

    for (const suffix of suffixes) {
        if (name.endsWith(suffix)) {
            matchedSuffix = suffix;
            prefix = name.slice(0, -suffix.length);
            break;
        }
    }

    if (matchedSuffix && prefix.length <= 9) {
        return prefix + "<br>" + matchedSuffix;
    }

    const midWords = ["ジュニア", "レディ", "サマー", "オータム", "チャレンジ"];
    for (const word of midWords) {
        const idx = name.indexOf(word);
        if (idx > 0) {
            return name.slice(0, idx) + "<br>" + name.slice(idx);
        }
    }

    if (matchedSuffix) {
        return prefix + "<br>" + matchedSuffix;
    }

    return name;
}

const generateTicket = openTicketModal;

function getBoxCombinationsCount(count, betType) {
    if (betType === 'umaren_box') {
        return (count * (count - 1)) / 2;
    } else if (betType === 'sanrenpuku_box') {
        return (count * (count - 1) * (count - 2)) / 6;
    }
    return 1;
}

function populateBakenSlip(data, amount, betType, eventInfo = eventSettings) {
    const isMulti = Array.isArray(data);
    const isBox = (betType === 'umaren_box' || betType === 'sanrenpuku_box');
    const firstData = isMulti ? data[0] : data;
    const cleanUmaName = (firstData.uma_name || '').replace('役', '').trim();
    const mode = getDisplayMode();

    applyBakenThemeColor(data);

    const bakenDOM = document.getElementById('bakenSlip');
    if (bakenDOM) {
        bakenDOM.classList.toggle('is-box-slip', isBox);
    }

    const now = new Date();
    const issueMonth = now.getMonth() + 1;
    const issueDay = now.getDate();
    document.getElementById('bkIssueDateVal').textContent = `${issueMonth}月${issueDay}日`;

    document.getElementById('bkSlipDate').textContent = formatBakenDate(eventInfo.date);

    let venueDisp = eventInfo.racecourse;
    if (venueDisp.length === 2) {
        venueDisp = '\u00A0' + venueDisp[0] + '\u00A0\u00A0\u00A0' + venueDisp[1];
    }
    document.getElementById('bkSlipVenue').textContent = venueDisp;
    document.getElementById('bkSlipRaceNumber').textContent = eventInfo.raceNumber;
    const gradeSuffix = (eventInfo.grade && eventInfo.grade !== '--') ? `<br>(${eventInfo.grade})` : '';
    document.getElementById('bkSlipRaceTitle').innerHTML = `${formatBakenRaceName(eventInfo.raceName)}${gradeSuffix}`;

    let totalAmount = amount;
    const comboRow = document.getElementById('bkCombinationsRow');
    const comboVal = document.getElementById('bkCombinationsVal');

    const getStars = (val, isTotal) => {
        const char = isTotal ? '★' : '☆';
        const targetLength = isTotal ? 7 : 6;
        const starCount = Math.max(0, targetLength - val.toString().length);
        return char.repeat(starCount);
    };

    if (isBox) {
        const comboCount = getBoxCombinationsCount(data.length, betType);
        totalAmount = amount * comboCount;

        if (betType === 'umaren_box') {
            bkBetTypeBox.innerHTML = `<div class="bk-small-en">QUINELLA</div><div class="bk-vert-text" style="margin: 15px 0;">ウマ連</div>`;
        } else {
            bkBetTypeBox.innerHTML = `<div class="bk-small-en">TRIO</div><div class="bk-vert-text" style="margin: 15px 0;">３連複</div>`;
        }

        bkMessage.style.display = 'block';
        bkMessage.classList.add('is-box-header');
        bkMessage.innerHTML = `ボックス <span class="bk-small-box-en">BOX</span>`;

        if (comboRow) {
            comboRow.style.display = 'block';
            if (comboVal) comboVal.textContent = comboCount;
        }
    } else {
        bkMessage.classList.remove('is-box-header');
        if (comboRow) comboRow.style.display = 'none';

        if (betType === 'umaren') {
            bkBetTypeBox.innerHTML = `<div class="bk-small-en">QUINELLA</div><div class="bk-vert-text" style="margin: 15px 0;">ウマ連</div>`;
            bkMessage.style.display = 'none';
        } else if (betType === 'sanrenpuku') {
            bkBetTypeBox.innerHTML = `<div class="bk-small-en">TRIO</div><div class="bk-vert-text" style="margin: 15px 0;">３連複</div>`;
            bkMessage.style.display = 'none';
        } else if (betType === 'tansho') {
            bkBetTypeBox.innerHTML = `<div class="bk-small-en">WIN</div><div class="bk-vert-text" style="margin: 15px 0;">単<br>勝</div>`;
            bkMessage.style.display = 'block';
            bkMessage.textContent = '激推し';
            totalAmount = amount;
        } else {
            bkBetTypeBox.innerHTML = `<div class="bk-small-en">WIN</div><div class="bk-vert-text">単<br>勝</div><div class="bk-plus">＋</div><div class="bk-vert-text">複<br>勝</div><div class="bk-small-en">PLACE<br>SHOW</div>`;
            bkMessage.style.display = 'block';
            bkMessage.textContent = 'がんばれ！';
            totalAmount = amount * 2;
        }
    }

    document.getElementById('bkVal').textContent = amount;
    document.getElementById('bkTotalVal').textContent = totalAmount;
    updateBkValScaling(totalAmount);

    document.getElementById('bkStarsSub').textContent = getStars(amount, false);
    document.getElementById('bkStarsTotal').textContent = getStars(totalAmount, true);

    if (isBox) {
        const isTwoCol = data.length >= 5;
        const colClass = isTwoCol ? 'is-col-2' : 'is-col-1';
        let boxHtml = `<div class="multi-names-container is-box ${colClass}">`;

        data.forEach(row => {
            const cleanName = (row.uma_name || '').replace('役', '').trim();
            const dispMain = (mode === 'cast') ? row.cast_name : cleanName;
            const scaleMain = getScaleVar(dispMain, 6, 1);

            boxHtml += `
                <div class="multi-name-block">
                    <div class="multi-cast-row">
                        <div class="multi-horse-number">${row.uma_number}</div>
                        <div class="multi-cast-name" style="--text-scale: ${scaleMain};">${dispMain}</div>
                    </div>
                </div>
            `;
        });

        if (isTwoCol && data.length < 8) {
            const emptyCount = 8 - data.length;
            for (let i = 0; i < emptyCount; i++) {
                boxHtml += `
                    <div class="multi-name-block is-empty-slot">
                        <div class="multi-cast-row">
                            <div class="multi-horse-number">☆</div>
                        </div>
                    </div>
                `;
            }
        }

        boxHtml += `</div>`;
        bkNameArea.innerHTML = boxHtml;

        const dummyCast = document.createElement('div');
        dummyCast.id = 'bkCast'; dummyCast.textContent = firstData.cast_name;
        const dummyName = document.createElement('div');
        dummyName.id = 'bkName'; dummyName.textContent = firstData.uma_name;
        dummyCast.style.display = 'none'; dummyName.style.display = 'none';
        bkNameArea.appendChild(dummyCast);
        bkNameArea.appendChild(dummyName);

    } else if (isMulti) {
        const countClass = (data.length === 2) ? 'is-umaren' : 'is-sanrenpuku';
        let multiHtml = `<div class="multi-names-container ${countClass}">`;
        data.forEach(row => {
            const cleanName = (row.uma_name || '').replace('役', '').trim();
            let dispMain, dispSub;
            if (mode === 'cast') {
                dispMain = row.cast_name;
                dispSub = `${cleanName}役`;
            } else {
                dispMain = cleanName;
                dispSub = `CV: ${row.cast_name}`;
            }

            const isUmaren = (data.length === 2);
            const baseScale = isUmaren ? 0.91 : 1;
            const scaleMain = getScaleVar(dispMain, 6, baseScale);
            const scaleSub = getScaleVar(dispSub, 10, 1);

            multiHtml += `
                <div class="multi-name-block">
                    <div class="multi-cast-row">
                        <div class="multi-horse-number">${row.uma_number}</div>
                        <div class="multi-cast-name" style="--text-scale: ${scaleMain};">${dispMain}</div>
                    </div>
                    <div class="multi-uma-name" style="--text-scale: ${scaleSub};">${dispSub}</div>
                </div>
            `;
        });
        multiHtml += `</div>`;
        bkNameArea.innerHTML = multiHtml;

        const dummyCast = document.createElement('div');
        dummyCast.id = 'bkCast'; dummyCast.textContent = firstData.cast_name;
        const dummyName = document.createElement('div');
        dummyName.id = 'bkName'; dummyName.textContent = firstData.uma_name;
        dummyCast.style.display = 'none'; dummyName.style.display = 'none';
        bkNameArea.appendChild(dummyCast);
        bkNameArea.appendChild(dummyName);

    } else {
        let dispMain, dispSub;
        if (mode === 'cast') {
            dispMain = firstData.cast_name;
            dispSub = `${cleanUmaName}役`;
        } else {
            dispMain = cleanUmaName;
            dispSub = `CV: ${firstData.cast_name}`;
        }

        const scaleMain = getScaleVar(dispMain, 6, 0.91);
        const scaleSub = getScaleVar(dispSub, 10, 1);

        bkNameArea.innerHTML = `
            <div class="bk-cast-row">
                <div id="bkNumber" class="bk-horse-number bk-tall">${firstData.uma_number}</div>
                <div id="bkCast" class="bk-cast-name bk-tall" style="--text-scale: ${scaleMain};">${dispMain}</div>
            </div>
            <div id="bkName" class="bk-uma-name bk-tall" style="--text-scale: ${scaleSub};">${dispSub}</div>
        `;
    }

    return totalAmount;
}

let hasShownShareModalOnce = false;

async function openTicketModal(data, amount, betType, isReissue = false) {
    currentGeneratingTicketParams = { data, amount, betType, isReissue };

    const modalCheckbox = document.getElementById('modalReflectCharColorCheckbox');
    if (modalCheckbox) modalCheckbox.checked = reflectCharColor;
    const modalBitmapCheckbox = document.getElementById('modalBitmapTextCheckbox');
    if (modalBitmapCheckbox) modalBitmapCheckbox.checked = advancedSettings.bitmapText;
    const modalInvertCheckbox = document.getElementById('modalInvertColorCheckbox');
    if (modalInvertCheckbox) modalInvertCheckbox.checked = invertCharColor;

    updateInvertColorVisibility();

    // 1. 発券ボタン押下直後に即座にモーダルを表示し、ローディング状態にする
    const shareLoadingHint = document.getElementById('shareLoadingHint');
    if (shareLoadingHint) {
        shareLoadingHint.style.display = hasShownShareModalOnce ? 'none' : 'block';
    }
    hasShownShareModalOnce = true;

    shareImagePreview.src = '';
    shareImagePreview.style.display = 'none';
    shareImageLoading.style.display = 'flex';
    shareModal.classList.add('show');

    // UIスレッドの描画更新（モーダル表示）を確実に完了させてから重い生成処理を開始
    await new Promise(resolve => setTimeout(resolve, 20));

    const isMulti = Array.isArray(data);
    const firstData = isMulti ? data[0] : data;

    const totalAmount = populateBakenSlip(data, amount, betType, eventSettings);

    const rightCol = document.querySelector('.bk-right-col');
    if (rightCol) {
        const existingWatermarks = rightCol.querySelectorAll('.watermark-text');
        existingWatermarks.forEach(el => el.remove());

        const patternText = 'AAA<br>AAA<br>AAA';
        const watermark1 = document.createElement('div');
        watermark1.className = 'watermark-text watermark-layer1';
        watermark1.innerHTML = patternText;

        const watermark2 = document.createElement('div');
        watermark2.className = 'watermark-text watermark-layer2';
        watermark2.innerHTML = patternText;

        rightCol.appendChild(watermark1);
        rightCol.appendChild(watermark2);
    }

    const bakenDOM = document.getElementById('bakenSlip');

    try {
        const _0xV = (function (_0x1, _0x2, _0x3, _0x4) {
            const _0xN = allUmaData.some(r => r.cast_name === _0x1 && r.uma_name === _0x2.replace('役', ''));
            const _0xB = [atob('ODEw'), atob('ODI5'), atob('ODM0'), atob('Mzk2'), atob('NDI5'), atob('MTE0NTE0'), atob('MTkxOQ=='), atob('NDU0NQ==')];
            const _0xI = _0xB.some(x => _0x3.includes(x) || _0x4.includes(x));
            return _0xN && !_0xI;
        })(
            firstData.cast_name,
            firstData.uma_name,
            document.getElementById(atob('YmtWYWw=')).textContent,
            document.getElementById(atob('YmtUb3RhbFZhbA==')).textContent
        );

        if (!_0xV) {
            shareModal.classList.remove('show');
            currentGeneratingTicketParams = null;
            showToast('エラー：不正な値が検出されました');
            return;
        }

        const canvas = await captureBakenSlip(bakenDOM);
        const imgDataUrl = canvas.toDataURL('image/png');

        shareImagePreview.src = imgDataUrl;
        shareImageLoading.style.display = 'none';
        shareImagePreview.style.display = 'block';

        let castNamesText = "";
        const tweetMode = getDisplayMode();

        if (isMulti) {
            if (tweetMode === 'cast') {
                castNamesText = data.map(row => `${row.cast_name}さん`).join('・');
            } else {
                castNamesText = data.map(row => (row.uma_name || '').replace('役', '').trim()).join('・');
            }
        } else {
            if (tweetMode === 'cast') {
                castNamesText = `${firstData.cast_name}さん`;
            } else {
                castNamesText = (firstData.uma_name || '').replace('役', '').trim();
            }
        }

        let tweetText = "";
        if (isMulti && data.length >= 4) {
            tweetText = `推しバ券を発券しました！\n\n#推しバ券メーカー\nhttps://nyaftama.github.io/uma-ouen-baken/`;
        } else {
            tweetText = `推しバ券を発券しました！\n\n${castNamesText}、がんばれ！\n\n#推しバ券メーカー\nhttps://nyaftama.github.io/uma-ouen-baken/`;
        }
        document.getElementById('shareTwitterBtn').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

        if (!isReissue) {
            saveHistory(betType, data, amount, totalAmount);
        }

        shareModal.classList.add('show');

    } catch (error) {
        console.error('画像生成エラー:', error);
        shareImageLoading.innerText = 'エラー：推しバ券の生成に失敗しました';
    }
}

const HISTORY_KEY = 'uma_baken_history_allstar';

function saveHistory(betType, data, amount, totalAmount) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const newEntry = {
        id: 'baken_' + Date.now(),
        date: new Date().toLocaleString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        betType: betType,
        combinations: [data],
        amount: amount,
        totalAmount: totalAmount,
        eventInfo: { ...eventSettings }
    };
    history.unshift(newEntry);

    let totalTickets = 0;
    const trimmedHistory = [];
    for (const entry of history) {
        if (totalTickets + entry.combinations.length <= 8) {
            trimmedHistory.push(entry);
            totalTickets += entry.combinations.length;
        } else {
            break;
        }
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
}

const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');

document.getElementById('historyBtn').addEventListener('click', (e) => {
    e.preventDefault();
    renderHistoryList();
    historyModal.classList.add('show');
});

document.getElementById('closeHistoryBtn').addEventListener('click', () => {
    historyModal.classList.remove('show');
});

function renderHistoryList() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-list-message">履歴がありません</div>';
        return;
    }

    const mode = getDisplayMode();

    history.forEach(entry => {
        let nameStr = '';

        if (Array.isArray(entry.combinations[0])) {
            if (mode === 'cast') {
                nameStr = entry.combinations[0].map(r => r.cast_name).join('・');
            } else {
                nameStr = entry.combinations[0].map(r => (r.uma_name || '').replace('役', '').trim()).join('・');
            }
        } else {
            const firstData = entry.combinations[0];
            if (mode === 'cast') {
                nameStr = firstData.cast_name;
            } else {
                nameStr = (firstData.uma_name || '').replace('役', '').trim();
            }
        }

        let typeStr = '';
        if (entry.betType === 'tansho') typeStr = '単勝';
        else if (entry.betType === 'ouen') typeStr = '応援(単＋複)';
        else if (entry.betType === 'umaren') typeStr = 'ウマ連';
        else if (entry.betType === 'sanrenpuku') typeStr = '3連複';
        else if (entry.betType === 'umaren_box') typeStr = 'ウマ連BOX';
        else if (entry.betType === 'sanrenpuku_box') typeStr = '3連複BOX';

        let eventInfoStr = 'ーーー';
        if (entry.eventInfo) {
            const formattedDate = entry.eventInfo.date.replace(/-/g, '/');
            eventInfoStr = `${formattedDate}｜${entry.eventInfo.racecourse}｜${entry.eventInfo.raceNumber}R｜${entry.eventInfo.grade}｜${entry.eventInfo.raceName}`;
        }

        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
                    <button class="history-del-btn" data-id="${entry.id}">削除</button>
                    
                    <div class="history-info" style="margin-left: 5px;">
                        <div class="history-date" style="display: flex; flex-direction: column; gap: 2px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span>${entry.date} 発券</span>
                                <a href="#" class="history-reissue-link" data-id="${entry.id}" style="color: var(--primary-color); font-weight: bold; text-decoration: underline; font-size: inherit;">再発券</a>
                            </div>
                            <div>${eventInfoStr}</div>
                        </div>
                        <div class="history-title" style="margin-top: 4px;">${typeStr}：${nameStr}</div>
                    </div>
                    
                    <label class="checkbox-wrapper">
                        <input type="checkbox" class="history-item-checkbox" value="${entry.id}">
                        <div class="custom-checkbox"></div>
                    </label>
                `;
        historyList.appendChild(div);
    });

    document.querySelectorAll('.history-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            let hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            hist = hist.filter(h => h.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
            renderHistoryList();
        });
    });

    document.querySelectorAll('.history-reissue-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = e.target.getAttribute('data-id');
            const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            const targetEntry = hist.find(h => h.id === id);

            if (targetEntry) {
                historyModal.classList.remove('show');

                if (targetEntry.eventInfo) {
                    eventSettings = { ...targetEntry.eventInfo };
                    updateEventSettingsUI();
                }

                generateTicket(targetEntry.combinations[0], targetEntry.amount, targetEntry.betType, true);
            }
        });
    });
}

let isAllSelected = false;
document.getElementById('selectAllHistoryBtn').addEventListener('click', (e) => {
    e.preventDefault();
    isAllSelected = !isAllSelected;
    document.querySelectorAll('#historyList .history-item-checkbox').forEach(cb => cb.checked = isAllSelected);
});

document.getElementById('deleteAllHistoryBtn').addEventListener('click', (e) => {
    e.preventDefault();

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (history.length === 0) {
        showToast('削除する履歴がありません');
        return;
    }

    deleteConfirmModal.classList.add('show');
});

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    deleteConfirmModal.classList.remove('show');
});

document.getElementById('executeDeleteBtn').addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryList();
    deleteConfirmModal.classList.remove('show');
    showToast('すべての履歴を削除しました');
});

document.getElementById('printSelectedBtn').addEventListener('click', async () => {
    const selectedIds = Array.from(document.querySelectorAll('#historyList .history-item-checkbox:checked')).map(cb => cb.value);
    if (selectedIds.length === 0) {
        showToast('印刷用PDFに含めるバ券を選択してください');
        return;
    }

    const printBtn = document.getElementById('printSelectedBtn');
    printBtn.disabled = true;
    printBtn.textContent = 'PDF生成中...';

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const printTargets = history.filter(h => selectedIds.includes(h.id));

    let totalTickets = 0;
    printTargets.forEach(target => {
        totalTickets += target.combinations.length;
    });
    let processedTickets = 0;

    showToast(`PDFデータを生成しています... (0%)`, 99999);

    const imageUrls = [];
    const bakenDOM = document.getElementById('bakenSlip');

    try {
        for (const target of printTargets) {
            const currentEvent = target.eventInfo || eventSettings;
            const betType = target.betType;

            for (const comboData of target.combinations) {
                populateBakenSlip(comboData, target.amount, betType, currentEvent);

                const rightCol = document.querySelector('.bk-right-col');
                if (rightCol) {
                    const existingWatermarks = rightCol.querySelectorAll('.watermark-text');
                    existingWatermarks.forEach(el => el.remove());

                    const patternText = 'AAA<br>AAA<br>AAA';
                    const watermark1 = document.createElement('div');
                    watermark1.className = 'watermark-text watermark-layer1';
                    watermark1.innerHTML = patternText;

                    const watermark2 = document.createElement('div');
                    watermark2.className = 'watermark-text watermark-layer2';
                    watermark2.innerHTML = patternText;

                    rightCol.appendChild(watermark1);
                    rightCol.appendChild(watermark2);
                }

                await new Promise(resolve => setTimeout(resolve, 150));

                const canvas = await captureBakenSlip(bakenDOM);
                imageUrls.push(canvas.toDataURL('image/jpeg', 0.85));

                processedTickets++;
                const percent = Math.floor((processedTickets / totalTickets) * 100);
                showToast(`PDFデータを生成しています... (${percent}%)`, 99999);
            }
        }

        showToast('PDFファイルを出力しています...', 99999);

    } catch (e) {
        console.error(e);
        showToast('PDFの生成に失敗しました');
    } finally {
        printBtn.disabled = false;
        printBtn.textContent = 'PDF保存';
    }

    if (imageUrls.length > 0) {
        generateAndDownloadPDF(imageUrls);
    }
});

function generateAndDownloadPDF(images) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const ticketW = 85;
    const ticketH = 54;
    const gapX = 15;
    const gapY = 15;
    const startX = (210 - (ticketW * 2 + gapX)) / 2;
    const startY = 20;

    let currentX = startX;
    let currentY = startY;
    let countOnPage = 0;

    images.forEach((imgSrc) => {
        if (countOnPage >= 8) {
            doc.addPage();
            currentX = startX;
            currentY = startY;
            countOnPage = 0;
        }

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        const x = currentX;
        const y = currentY;

        doc.line(x - 4, y, x, y);
        doc.line(x, y - 4, x, y);
        doc.line(x + ticketW, y, x + ticketW + 4, y);
        doc.line(x + ticketW, y - 4, x + ticketW, y);
        doc.line(x - 4, y + ticketH, x, y + ticketH);
        doc.line(x, y + ticketH, x, y + ticketH + 4);
        doc.line(x + ticketW, y + ticketH, x + ticketW + 4, y + ticketH);
        doc.line(x + ticketW, y + ticketH, x + ticketW, y + ticketH + 4);

        doc.addImage(imgSrc, 'JPEG', x, y, ticketW, ticketH);

        countOnPage++;
        if (countOnPage % 2 === 1) {
            currentX += ticketW + gapX;
        } else {
            currentX = startX;
            currentY += ticketH + gapY;
        }
    });

    doc.save('oshi_baken.pdf');
    showToast('PDFのダウンロードが完了しました！');
}

document.getElementById('shareCloseBtn').addEventListener('click', () => {
    shareModal.classList.remove('show');
    currentGeneratingTicketParams = null;
});

const updateCartQty = (newAmount) => {
    if (newAmount < 100) newAmount = 100;
    if (newAmount > MAX_BAKEN_QTY) {
        newAmount = MAX_BAKEN_QTY;
    }
    cartAmount = newAmount;
    const cartQtySpan = document.getElementById('cartQtySpan');
    if (cartQtySpan) {
        cartQtySpan.textContent = cartAmount;
        adjustQtyDisplayScale(cartQtySpan);
    }

    const isReady = cartItems.length >= 2;
    document.getElementById('cartMinusBtn').disabled = !isReady || cartAmount <= 100;
    document.getElementById('cartPlusBtn').disabled = !isReady || cartAmount >= MAX_BAKEN_QTY;
    updateCartIssueBtn();
};

const cartQtySpan = document.getElementById('cartQtySpan');
if (cartQtySpan) {
    setupQtyDisplayEdit(cartQtySpan, () => cartAmount, (newVal) => updateCartQty(newVal));
}

setupLongPress(document.getElementById('cartMinusBtn'), () => updateCartQty(cartAmount - 100));
setupLongPress(document.getElementById('cartPlusBtn'), () => updateCartQty(cartAmount + 100));

const cartClearBtn = document.getElementById('cartClearBtn');
if (cartClearBtn) {
    cartClearBtn.addEventListener('click', () => {
        if (cartItems.length === 0) return;
        cartItems = [];
        currentTopView = 'event';
        isCartExpanded = false;
        updateCartUI();
        showToast('連勝候補リストをクリアしました');
    });
}

const cartExpandBtn = document.getElementById('cartExpandBtn');
if (cartExpandBtn) {
    cartExpandBtn.addEventListener('click', () => {
        isCartExpanded = !isCartExpanded;
        updateCartUI();
    });
}

window.addEventListener('resize', () => {
    updateCartExpandBtnVisibility();
});

document.getElementById('cartIssueBtn').addEventListener('click', () => {
    const count = cartItems.length;
    if (count < 2) return;

    let actualBetType = currentCartBetType;

    if (count === 2) {
        if (actualBetType !== 'umaren') {
            actualBetType = 'umaren';
            currentCartBetType = 'umaren';
            isCartBetTypeUserModified = false;
            if (cartBetTypeDropdownObj) {
                cartBetTypeDropdownObj.setValue('umaren');
            }
            showToast('券種をウマ連に変更しました');
        }
    } else if (count === 3) {
        if (actualBetType !== 'umaren_box' && actualBetType !== 'sanrenpuku') {
            actualBetType = 'sanrenpuku';
            currentCartBetType = 'sanrenpuku';
            if (cartBetTypeDropdownObj) cartBetTypeDropdownObj.setValue('sanrenpuku');
        }
    } else {
        if (actualBetType !== 'umaren_box' && actualBetType !== 'sanrenpuku_box') {
            actualBetType = 'sanrenpuku_box';
            currentCartBetType = 'sanrenpuku_box';
            if (cartBetTypeDropdownObj) cartBetTypeDropdownObj.setValue('sanrenpuku_box');
        }
    }

    generateTicket(cartItems, cartAmount, actualBetType);
});

document.getElementById('openHistoryFromShare').addEventListener('click', (e) => {
    e.preventDefault();
    shareModal.classList.remove('show');
    currentGeneratingTicketParams = null;
    renderHistoryList();
    historyModal.classList.add('show');
});

function parseAndFormatDate(input) {
    if (!input) return '';
    let str = String(input).trim();

    // 全角数字を半角に変換
    str = str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

    // yyyy年MM月dd日 または yyyy年M月d日
    let m = str.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
    if (m) {
        const y = m[1];
        const month = m[2].padStart(2, '0');
        const d = m[3].padStart(2, '0');
        return `${y}/${month}/${d}`;
    }

    // yyyyMMdd (8桁)
    m = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
        const y = m[1];
        const month = m[2];
        const d = m[3];
        return `${y}/${month}/${d}`;
    }

    // yyyy/MM/dd, yyyy-MM-dd, yyyy.MM.dd
    m = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) {
        const y = m[1];
        const month = m[2].padStart(2, '0');
        const d = m[3].padStart(2, '0');
        return `${y}/${month}/${d}`;
    }

    return str;
}

function formatBakenDate(input) {
    if (!input) return '';
    const formatted = parseAndFormatDate(input);
    if (!formatted) return String(input);
    const parts = formatted.split('/');
    if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(m) && !isNaN(d)) {
            return `${y}年${m}月${d}日`;
        }
    }
    return String(input);
}

function isValidFormattedDate(str) {
    const m = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const y = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    if (y < 1900 || y > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (d < 1 || d > 31) return false;
    const dateObj = new Date(y, month - 1, d);
    return dateObj.getFullYear() === y && (dateObj.getMonth() + 1) === month && dateObj.getDate() === d;
}

let eventSettings = {
    date: '2021/02/24',
    racecourse: '東京',
    raceNumber: '11',
    grade: 'GI',
    raceName: 'トゥインクルシリーズ'
};

function updateEventSettingsUI() {
    const formattedDate = eventSettings.date.replace(/-/g, '/');
    document.getElementById('currentEventInfo').textContent =
        `${formattedDate}｜${eventSettings.racecourse}｜${eventSettings.raceNumber}R｜${eventSettings.grade}｜${eventSettings.raceName}`;
}

function formatPeriod(key) {
    if (key === 'special') return 'スペシャル';
    const match = key.match(/^y(0[1-3])_m(0[1-9]|1[0-2])_(early|late)$/);
    if (!match) return key;

    const yearMap = { '01': 'ジュニア級', '02': 'クラシック級', '03': 'シニア級' };
    const periodMap = { 'early': '前半', 'late': '後半' };

    const year = yearMap[match[1]];
    const month = parseInt(match[2], 10) + '月';
    const period = periodMap[match[3]];

    return `${year}${month}${period}`;
}

function formatPeriods(periods) {
    if (periods.length === 0) return '';
    if (periods.length === 1) return formatPeriod(periods[0]);

    const parsed = periods.map(p => {
        if (p === 'special') return { type: 'special', label: 'スペシャル' };
        const match = p.match(/^y(0[1-3])_m(0[1-9]|1[0-2])_(early|late)$/);
        if (!match) return { type: 'unknown', label: p };
        return {
            type: 'standard',
            year: match[1],
            month: parseInt(match[2], 10),
            period: match[3]
        };
    });

    const groups = {};
    const others = [];

    parsed.forEach(item => {
        if (item.type === 'standard') {
            const periodKey = `${item.month}月${item.period === 'early' ? '前半' : '後半'}`;
            if (!groups[periodKey]) {
                groups[periodKey] = [];
            }
            groups[periodKey].push(item.year);
        } else {
            others.push(item.label);
        }
    });

    const yearLabelMap = { '01': 'ジュニア', '02': 'クラシック', '03': 'シニア' };
    const parts = [];

    for (const [periodKey, years] of Object.entries(groups)) {
        const yearLabels = years.map(y => yearLabelMap[y]).filter(Boolean);
        const yearStr = yearLabels.join('/');
        parts.push(`${yearStr}級${periodKey}`);
    }

    others.forEach(o => parts.push(o));
    return parts.join(', ');
}

function mapCsvGradeToUiGrade(grade) {
    if (!grade) return '';
    if (grade === 'G1') return 'GI';
    if (grade === 'G2') return 'GII';
    if (grade === 'G3') return 'GIII';
    return grade;
}

function getPeriodKey(row) {
    if (row.is_special === 'true') {
        return 'special';
    }
    const y = String(row.year).padStart(2, '0');
    const m = String(row.month).padStart(2, '0');
    const p = row.period === '前半' ? 'early' : 'late';
    return `y${y}_m${m}_${p}`;
}

function setupRaceNameSuggestion(optionsList) {
    const inputEl = document.getElementById('setRaceName');
    const boxEl = document.getElementById('raceSuggestionsBox');
    const clearBtn = document.getElementById('clearRaceInputBtn');

    inputEl.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        boxEl.innerHTML = '';

        clearBtn.style.display = keyword ? 'block' : 'none';

        if (!keyword) {
            boxEl.style.display = 'none';
            return;
        }

        const matches = optionsList.filter(item =>
            item.name.toLowerCase().includes(keyword) ||
            (item.kana && item.kana.toLowerCase().includes(keyword))
        ).slice(0, 5);

        if (matches.length === 0) {
            boxEl.style.display = 'none';
            return;
        }

        boxEl.style.display = 'block';
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';

            const periodStr = formatPeriods(match.periods);
            const mappedGrade = mapCsvGradeToUiGrade(match.grade);
            const gradeClass = match.grade ? match.grade.toLowerCase().replace('-', '_') : '';
            const showBadge = mappedGrade && mappedGrade !== '--';
            const badgeHtml = showBadge ? `<span class="suggestion-grade-badge grade-${gradeClass}">${mappedGrade}</span>` : '';
            div.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        ${badgeHtml}
                        <span>${match.name}</span>
                    </div>
                    <span class="suggestion-sub-value" style="font-size: 0.8rem; color: #888; white-space: nowrap; margin-left: 10px;">${periodStr}</span>
                </div>
            `;

            div.addEventListener('click', () => {
                inputEl.value = match.name;
                boxEl.innerHTML = '';
                boxEl.style.display = 'none';
                clearBtn.style.display = 'block';
                if (mappedGrade) {
                    document.getElementById('setGrade').value = mappedGrade;
                }
                if (match.track) {
                    document.getElementById('setRacecourse').value = match.track;
                }
            });
            boxEl.appendChild(div);
        });
    });

    inputEl.addEventListener('keydown', (e) => {
        if (e.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            const keyword = inputEl.value.toLowerCase().trim();
            const matches = optionsList.filter(item =>
                item.name.toLowerCase().includes(keyword) ||
                (item.kana && item.kana.toLowerCase().includes(keyword))
            );
            if (matches.length === 1) {
                inputEl.value = matches[0].name;
                boxEl.innerHTML = '';
                boxEl.style.display = 'none';
                clearBtn.style.display = 'block';
                const mappedGrade = mapCsvGradeToUiGrade(matches[0].grade);
                if (mappedGrade) {
                    document.getElementById('setGrade').value = mappedGrade;
                }
                if (matches[0].track) {
                    document.getElementById('setRacecourse').value = matches[0].track;
                }
            } else {
                boxEl.innerHTML = '';
                boxEl.style.display = 'none';
            }
            inputEl.blur();
        }
    });

    clearBtn.addEventListener('click', () => {
        inputEl.value = '';
        clearBtn.style.display = 'none';
        boxEl.innerHTML = '';
        boxEl.style.display = 'none';
        inputEl.focus();
    });

    document.addEventListener('click', (e) => {
        if (!inputEl.contains(e.target) && !boxEl.contains(e.target) && !clearBtn.contains(e.target)) {
            boxEl.innerHTML = '';
            boxEl.style.display = 'none';
        }
    });
}

function setupCustomDropdown(dropdownId, hiddenInputId, textId, optionsList, initialValue, onSelect) {
    const dropdown = document.getElementById(dropdownId);
    const trigger = dropdown ? dropdown.querySelector('.dropdown-trigger') : null;
    const menu = document.getElementById(dropdownId + 'Menu') || (dropdown ? dropdown.querySelector('.dropdown-menu') : null);
    const hiddenInput = document.getElementById(hiddenInputId);
    const textSpan = document.getElementById(textId);

    if (!dropdown || !trigger || !menu) return;

    menu.innerHTML = '';
    const allSelectableOptions = [];

    function addOptionItem(val, label) {
        allSelectableOptions.push({ value: String(val), label: String(label) });

        const itemBtn = document.createElement('button');
        itemBtn.type = 'button';
        itemBtn.className = 'dropdown-item';
        itemBtn.dataset.value = val;
        itemBtn.textContent = label;
        if (String(val) === String(initialValue)) {
            itemBtn.classList.add('active');
        }

        itemBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setCustomDropdownValue(dropdownId, hiddenInputId, textId, val, label);
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            if (onSelect) onSelect(val);
        });

        menu.appendChild(itemBtn);
    }

    if (Array.isArray(optionsList)) {
        optionsList.forEach(opt => {
            if (opt && typeof opt === 'object' && opt.group && Array.isArray(opt.items)) {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'dropdown-header';
                headerDiv.textContent = opt.group;
                menu.appendChild(headerDiv);

                opt.items.forEach(item => {
                    const val = typeof item === 'object' ? item.value : item;
                    const label = typeof item === 'object' ? item.label : item;
                    addOptionItem(val, label);
                });
            } else if (opt && typeof opt === 'object' && opt.isHeader) {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'dropdown-header';
                headerDiv.textContent = opt.label;
                menu.appendChild(headerDiv);
            } else {
                const val = typeof opt === 'object' ? opt.value : opt;
                const label = typeof opt === 'object' ? opt.label : opt;
                addOptionItem(val, label);
            }
        });
    }

    const currentOpt = allSelectableOptions.find(opt => String(opt.value) === String(initialValue));
    const initLabel = currentOpt ? currentOpt.label : initialValue;
    if (hiddenInput) hiddenInput.value = initialValue;
    if (textSpan) textSpan.textContent = initLabel;

    if (!trigger._hasDropdownListener) {
        trigger._hasDropdownListener = true;
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('open');
                    d.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
                }
            });
            dropdown.classList.toggle('open', !isOpen);
            trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
            if (!isOpen) {
                scrollActiveItemToCenter(menu);
            }
        });
    }
}

function setCustomDropdownValue(dropdownId, hiddenInputId, textId, value, customLabel) {
    const dropdown = document.getElementById(dropdownId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const textSpan = document.getElementById(textId);

    if (hiddenInput) hiddenInput.value = value;

    if (dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            let matchedLabel = customLabel;
            menu.querySelectorAll('.dropdown-item').forEach(item => {
                if (String(item.dataset.value) === String(value)) {
                    item.classList.add('active');
                    if (!matchedLabel) matchedLabel = item.textContent;
                } else {
                    item.classList.remove('active');
                }
            });
            if (textSpan && matchedLabel) {
                textSpan.textContent = matchedLabel;
            }
        }
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            d.classList.remove('open');
            d.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
        });
    }
});

let pickerYear = 2024;
let pickerMonth = 10;
let pickerDay = 27;

function initDatePicker() {
    const datePickerModal = document.getElementById('datePickerModal');
    const openBtn = document.getElementById('openDatePickerBtn');
    const cancelBtn = document.getElementById('cancelDatePickerBtn');
    const confirmBtn = document.getElementById('confirmDatePickerBtn');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const eventDateInput = document.getElementById('setEventDate');

    if (!datePickerModal || !openBtn) return;

    function renderDatePickerCalendar() {
        const grid = document.getElementById('calendarDaysGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const daysInMonth = new Date(pickerYear, pickerMonth, 0).getDate();
        if (pickerDay > daysInMonth) {
            pickerDay = daysInMonth;
        }

        const firstDayIndex = new Date(pickerYear, pickerMonth - 1, 1).getDay();
        const totalDaysFilled = firstDayIndex + daysInMonth;
        const weeksCount = Math.ceil(totalDaysFilled / 7);

        const targetRows = weeksCount === 6 ? 6 : 5;
        grid.className = `calendar-days-grid rows-${targetRows}`;

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day-btn empty';
            grid.appendChild(emptyDiv);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayBtn = document.createElement('button');
            dayBtn.type = 'button';
            dayBtn.className = 'calendar-day-btn';
            dayBtn.textContent = d;

            const dayOfWeek = (firstDayIndex + d - 1) % 7;
            if (dayOfWeek === 0) dayBtn.classList.add('sun');
            if (dayOfWeek === 6) dayBtn.classList.add('sat');
            if (d === pickerDay) dayBtn.classList.add('active');

            dayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                pickerDay = d;
                grid.querySelectorAll('.calendar-day-btn').forEach(b => b.classList.remove('active'));
                dayBtn.classList.add('active');
            });

            grid.appendChild(dayBtn);
        }

        const totalCells = targetRows * 7;
        const remainingCells = totalCells - totalDaysFilled;
        for (let i = 0; i < remainingCells; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day-btn empty';
            grid.appendChild(emptyDiv);
        }
    }

    function changeMonth(delta) {
        let newM = pickerMonth + delta;
        let newY = pickerYear;
        if (newM < 1) {
            newM = 12;
            newY--;
        } else if (newM > 12) {
            newM = 1;
            newY++;
        }
        if (newY < 1901) {
            newY = 1901;
            newM = 1;
        } else if (newY > 2100) {
            newY = 2100;
            newM = 12;
        }
        pickerYear = newY;
        pickerMonth = newM;

        setCustomDropdownValue('datePickerYearDropdown', '', 'datePickerYearSelectedText', String(pickerYear), `${pickerYear}年`);
        setCustomDropdownValue('datePickerMonthDropdown', '', 'datePickerMonthSelectedText', String(pickerMonth), `${pickerMonth}月`);
        renderDatePickerCalendar();
    }

    function setupDatePickerDropdowns() {
        const yearOptions = [];
        for (let y = 1901; y <= 2100; y++) {
            yearOptions.push({ value: String(y), label: `${y}年` });
        }

        setupCustomDropdown(
            'datePickerYearDropdown',
            '',
            'datePickerYearSelectedText',
            yearOptions,
            String(pickerYear),
            (val) => {
                pickerYear = parseInt(val, 10);
                renderDatePickerCalendar();
            }
        );

        const monthOptions = [];
        for (let m = 1; m <= 12; m++) {
            monthOptions.push({ value: String(m), label: `${m}月` });
        }

        setupCustomDropdown(
            'datePickerMonthDropdown',
            '',
            'datePickerMonthSelectedText',
            monthOptions,
            String(pickerMonth),
            (val) => {
                pickerMonth = parseInt(val, 10);
                renderDatePickerCalendar();
            }
        );
    }

    setupDatePickerDropdowns();

    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentDateVal = eventDateInput ? eventDateInput.value : eventSettings.date;
        const formatted = parseAndFormatDate(currentDateVal);
        if (formatted && isValidFormattedDate(formatted)) {
            const parts = formatted.split('/');
            pickerYear = parseInt(parts[0], 10);
            pickerMonth = parseInt(parts[1], 10);
            pickerDay = parseInt(parts[2], 10);
        } else {
            const today = new Date();
            pickerYear = today.getFullYear();
            pickerMonth = today.getMonth() + 1;
            pickerDay = today.getDate();
        }

        setCustomDropdownValue('datePickerYearDropdown', '', 'datePickerYearSelectedText', String(pickerYear), `${pickerYear}年`);
        setCustomDropdownValue('datePickerMonthDropdown', '', 'datePickerMonthSelectedText', String(pickerMonth), `${pickerMonth}月`);
        renderDatePickerCalendar();
        datePickerModal.classList.add('show');
    });

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changeMonth(-1);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changeMonth(1);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            datePickerModal.classList.remove('show');
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const y = pickerYear;
            const m = String(pickerMonth).padStart(2, '0');
            const d = String(pickerDay).padStart(2, '0');
            if (eventDateInput) {
                eventDateInput.value = `${y}/${m}/${d}`;
            }
            datePickerModal.classList.remove('show');
        });
    }
}

async function initEventSettings() {
    const raceNumOptions = [];
    for (let i = 1; i <= 13; i++) {
        raceNumOptions.push({ value: String(i), label: `${i}R` });
    }
    setupCustomDropdown('raceNumberDropdown', 'setRaceNumber', 'raceNumberSelectedText', raceNumOptions, eventSettings.raceNumber);

    try {
        const optResponse = await fetch('./data/option_list.json?v=' + version);
        const options = await optResponse.json();

        const csvResponse = await fetch('./data/race_list.csv?v=' + version);
        const csvText = await csvResponse.text();
        const csvData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
        allRaceData = csvData;

        function getNextSunday() {
            const date = new Date();
            const day = date.getDay();
            const diff = 7 - day;
            date.setDate(date.getDate() + diff);

            return new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(date).replace(/-/g, '/');
        }

        eventSettings.date = getNextSunday();

        setupCustomDropdown('racecourseDropdown', 'setRacecourse', 'racecourseSelectedText', options.racecourse_name, eventSettings.racecourse);

        const gradeOptions = options.grade_name.map(name => ({ value: name, label: name }));
        setupCustomDropdown('gradeDropdown', 'setGrade', 'gradeSelectedText', gradeOptions, eventSettings.grade);

        const optionsRaceName = {};
        const raceGradeMap = {};
        const raceTrackMap = {};
        const raceKanaMap = {};
        csvData.forEach(row => {
            const name = row.race_name;
            if (!name) return;
            const periodKey = getPeriodKey(row);
            if (!optionsRaceName[periodKey]) {
                optionsRaceName[periodKey] = [];
            }
            if (!optionsRaceName[periodKey].includes(name)) {
                optionsRaceName[periodKey].push(name);
            }
            raceGradeMap[name] = row.race_grade;
            raceTrackMap[name] = row.race_track;
            raceKanaMap[name] = row.race_name_kana;
        });

        const raceListWithPeriod = [];
        const raceMap = {};
        for (const [period, names] of Object.entries(optionsRaceName)) {
            names.forEach(name => {
                if (!raceMap[name]) {
                    raceMap[name] = [];
                }
                if (!raceMap[name].includes(period)) {
                    raceMap[name].push(period);
                }
            });
        }
        for (const [name, periods] of Object.entries(raceMap)) {
            raceListWithPeriod.push({
                name,
                periods,
                grade: raceGradeMap[name] || '',
                track: raceTrackMap[name] || '',
                kana: raceKanaMap[name] || ''
            });
        }
        setupRaceNameSuggestion(raceListWithPeriod);

        const raceListModal = document.getElementById('raceListModal');
        const raceGridContainer = document.getElementById('raceGridContainer');
        raceGridContainer.innerHTML = '';

        for (const [period, names] of Object.entries(optionsRaceName)) {
            if (names.length === 0) continue;

            const groupDiv = document.createElement('div');
            groupDiv.className = 'race-group';
            groupDiv.style.marginBottom = '15px';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'settings-form-group';
            headerDiv.style.marginBottom = '6px';

            const label = document.createElement('label');
            label.textContent = formatPeriod(period);
            headerDiv.appendChild(label);
            groupDiv.appendChild(headerDiv);

            const gridDiv = document.createElement('div');
            gridDiv.className = 'race-grid-container';
            gridDiv.style.display = 'grid';
            gridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(130px, 1fr))';
            gridDiv.style.gap = '8px';
            gridDiv.style.padding = '0';

            names.forEach(name => {
                const item = document.createElement('div');
                const rawGrade = raceGradeMap[name] || '';
                const mappedGrade = mapCsvGradeToUiGrade(rawGrade);
                const gradeClass = rawGrade.toLowerCase().replace('-', '_');
                const track = raceTrackMap[name] || '';

                item.className = 'race-grid-item';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'race-item-name';
                nameSpan.style.marginBottom = '2px';
                nameSpan.textContent = name;
                item.appendChild(nameSpan);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'race-item-info';

                if (mappedGrade && mappedGrade !== '--') {
                    const badgeSpan = document.createElement('span');
                    badgeSpan.className = `suggestion-grade-badge grade-${gradeClass}`;
                    badgeSpan.textContent = mappedGrade;
                    if (!track) {
                        badgeSpan.style.marginRight = '0';
                    }
                    infoDiv.appendChild(badgeSpan);
                }

                if (track) {
                    const trackSpan = document.createElement('span');
                    trackSpan.className = 'race-item-track';
                    trackSpan.style.fontSize = '0.75rem';
                    trackSpan.style.color = '#666';
                    trackSpan.textContent = track;
                    infoDiv.appendChild(trackSpan);
                }

                if (infoDiv.children.length > 0) {
                    item.appendChild(infoDiv);
                }

                item.addEventListener('click', () => {
                    const inputEl = document.getElementById('setRaceName');
                    const clearBtn = document.getElementById('clearRaceInputBtn');
                    const boxEl = document.getElementById('raceSuggestionsBox');

                    inputEl.value = name;
                    clearBtn.style.display = 'block';

                    if (boxEl) {
                        boxEl.innerHTML = '';
                        boxEl.style.display = 'none';
                    }

                    if (mappedGrade) {
                        setCustomDropdownValue('gradeDropdown', 'setGrade', 'gradeSelectedText', mappedGrade);
                    }
                    if (track) {
                        setCustomDropdownValue('racecourseDropdown', 'setRacecourse', 'racecourseSelectedText', track);
                    }

                    raceListModal.classList.remove('show');
                });
                gridDiv.appendChild(item);
            });

            groupDiv.appendChild(gridDiv);
            raceGridContainer.appendChild(groupDiv);
        }

        document.getElementById('openRaceListBtn').addEventListener('click', (e) => {
            e.preventDefault();
            raceListModal.classList.add('show');
        });

        document.getElementById('closeRaceListBtn').addEventListener('click', () => {
            raceListModal.classList.remove('show');
        });

        const eventDateInput = document.getElementById('setEventDate');
        if (eventDateInput) {
            eventDateInput.addEventListener('focus', (e) => {
                e.target.select();
            });
            eventDateInput.addEventListener('mouseup', () => { });
            eventDateInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    eventDateInput.blur();
                }
            });
            eventDateInput.addEventListener('blur', () => {
                const formatted = parseAndFormatDate(eventDateInput.value);
                if (formatted) {
                    eventDateInput.value = formatted;
                }
            });
        }

        initDatePicker();

    } catch (error) {
        console.error('オプションリストまたはレースリストの読み込みに失敗しました:', error);
    }

    document.getElementById('setEventDate').value = eventSettings.date;
    updateEventSettingsUI();
}

document.getElementById('openSettingsBtn').addEventListener('click', () => {
    document.getElementById('setEventDate').value = eventSettings.date;
    setCustomDropdownValue('racecourseDropdown', 'setRacecourse', 'racecourseSelectedText', eventSettings.racecourse);
    setCustomDropdownValue('raceNumberDropdown', 'setRaceNumber', 'raceNumberSelectedText', eventSettings.raceNumber);
    setCustomDropdownValue('gradeDropdown', 'setGrade', 'gradeSelectedText', eventSettings.grade);
    document.getElementById('setRaceName').value = eventSettings.raceName;

    const currentRaceName = document.getElementById('setRaceName').value;
    document.getElementById('clearRaceInputBtn').style.display = currentRaceName ? 'block' : 'none';
    document.getElementById('settingsModal').classList.add('show');
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('show');
});

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const rawDate = document.getElementById('setEventDate').value;
    const inputRaceName = document.getElementById('setRaceName').value;

    const formattedDate = parseAndFormatDate(rawDate);
    if (!formattedDate || !isValidFormattedDate(formattedDate)) {
        showToast('エラー：開催日を正しい日付（例: 2024/10/27）で入力してください');
        return;
    }
    document.getElementById('setEventDate').value = formattedDate;

    const flatRaceNames = allRaceData.map(r => r.race_name).filter(Boolean);

    if (!flatRaceNames.includes(inputRaceName)) {
        showToast('エラー：リストに存在しないレース名です');
        return;
    }

    eventSettings.date = formattedDate;
    eventSettings.racecourse = document.getElementById('setRacecourse').value;
    eventSettings.raceNumber = document.getElementById('setRaceNumber').value;
    eventSettings.grade = document.getElementById('setGrade').value;
    eventSettings.raceName = inputRaceName;

    updateEventSettingsUI();
    document.getElementById('settingsModal').classList.remove('show');
    showToast('開催情報を更新しました');
});

if (!document.body.getAttribute('data-display-mode')) {
    document.body.setAttribute('data-display-mode', 'cast');
}

initEventSettings();



async function captureBakenSlip(bakenDOM) {
    const baseOptions = {
        useCORS: true,
        logging: false,
        width: 760,
        height: 420,
        windowWidth: 760,
        windowHeight: 420,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
            if (element.classList && (element.classList.contains('container') || element.classList.contains('modal-overlay'))) {
                return true;
            }
            return false;
        },
        onclone: (clonedDoc) => {
            const container = clonedDoc.querySelector('.container');
            if (container) container.style.display = 'none';
            const modals = clonedDoc.querySelectorAll('.modal-overlay');
            modals.forEach(m => m.style.display = 'none');

            const bContainer = clonedDoc.getElementById('bakenContainer');
            if (bContainer) {
                bContainer.style.position = 'static';
                bContainer.style.top = '0';
                bContainer.style.left = '0';
                bContainer.style.opacity = '1';
                bContainer.style.zIndex = '1';
            }
        }
    };

    if (advancedSettings.bitmapText) {
        bakenDOM.classList.add('capture-bg-only');
        const bgCanvas = await html2canvas(bakenDOM, {
            ...baseOptions,
            scale: 2
        });
        bakenDOM.classList.remove('capture-bg-only');

        bakenDOM.classList.add('capture-text-only');
        const textCanvas = await html2canvas(bakenDOM, {
            ...baseOptions,
            scale: 1.25,
            backgroundColor: '#ffffff'
        });
        bakenDOM.classList.remove('capture-text-only');

        const ctxText = textCanvas.getContext('2d');
        const imageData = ctxText.getImageData(0, 0, textCanvas.width, textCanvas.height);
        const data = imageData.data;
        const threshold = 152;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;

            if (brightness < threshold) {
                data[i] = 17;
                data[i + 1] = 17;
                data[i + 2] = 17;
                data[i + 3] = 255;
            } else {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 0;
            }
        }
        ctxText.putImageData(imageData, 0, 0);

        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = bgCanvas.width;
        compositeCanvas.height = bgCanvas.height;

        const compositeCtx = compositeCanvas.getContext('2d');
        compositeCtx.drawImage(bgCanvas, 0, 0);
        compositeCtx.imageSmoothingEnabled = false;
        compositeCtx.drawImage(textCanvas, 0, 0, compositeCanvas.width, compositeCanvas.height);

        return compositeCanvas;
    } else {
        return await html2canvas(bakenDOM, {
            ...baseOptions,
            scale: 2,
            backgroundColor: '#ffffff'
        });
    }
}

// モーダル開閉時の背面スクロール制御
const modalObserver = new MutationObserver(() => {
    const hasOpenModal = document.querySelector('.modal-overlay.show') !== null;
    if (hasOpenModal) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
});
if (document.readyState !== 'loading') {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
}
