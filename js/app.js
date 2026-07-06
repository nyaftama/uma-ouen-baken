
const version = document.getElementById('version') ? document.getElementById('version').textContent : '1.06e';
const umaCsvPath = './data/uma_list.csv?v=' + version;

let allUmaData = [];
let searchKeywordsArray = [];

let ticketAmounts = {};
let ticketTypes = {};
let umaNumbers = {};

let cartItems = [];
let cartAmount = 100;

let advancedSettings = {
    bitmapText: false
};

try {
    const savedAdvancedSettings = localStorage.getItem('uma_baken_advanced_settings_allstar');
    if (savedAdvancedSettings) {
        advancedSettings = JSON.parse(savedAdvancedSettings);
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

document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('reflectCharColorCheckbox');
    if (checkbox) {
        checkbox.checked = reflectCharColor;
        checkbox.addEventListener('change', (e) => {
            reflectCharColor = e.target.checked;
            try {
                localStorage.setItem('uma_baken_reflect_color', reflectCharColor);
            } catch (err) {
                console.error(err);
            }
        });
    }

    const bitmapCheckbox = document.getElementById('bitmapTextCheckbox');
    if (bitmapCheckbox) {
        bitmapCheckbox.checked = advancedSettings.bitmapText;
        bitmapCheckbox.addEventListener('change', (e) => {
            advancedSettings.bitmapText = e.target.checked;
            try {
                localStorage.setItem('uma_baken_advanced_settings_allstar', JSON.stringify(advancedSettings));
            } catch (err) {
                console.error(err);
            }
        });
    }


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
    return {
        bg: `hsl(${hslMain.h}, ${hslMain.s}%, ${bgLightness}%)`,
        theme: `hsl(${hslMain.h}, ${hslMain.s}%, ${borderLightness}%)`,
        watermark: `hsl(${hslSub.h}, ${hslSub.s}%, ${watermarkLightness}%)`
    };
}

function applyBakenThemeColor(data) {
    const bakenDOM = document.getElementById('bakenSlip');
    if (!bakenDOM) return;

    const isEnabled = document.getElementById('reflectCharColorCheckbox')?.checked;
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

    const castName = firstData.cast_name;
    const cleanUmaName = (firstData.uma_name || '').replace('役', '').trim();
    const found = allUmaData.find(r => r.cast_name === castName || (r.uma_name && r.uma_name.replace('役', '').trim() === cleanUmaName));

    if (found && found.main_color) {
        const colors = getThemeColors(found.main_color, found.sub_color);
        bakenDOM.style.setProperty('--baken-bg-color', colors.bg);
        bakenDOM.style.setProperty('--baken-theme-color', colors.theme);
        bakenDOM.style.setProperty('--baken-watermark-color', colors.watermark);
    } else {
        bakenDOM.style.removeProperty('--baken-bg-color');
        bakenDOM.style.removeProperty('--baken-theme-color');
        bakenDOM.style.removeProperty('--baken-watermark-color');
    }
}

function updateCartUI() {
    const cartArea = document.getElementById('cartArea');
    const itemsDiv = document.getElementById('cartItems');
    const cartRight = document.getElementById('cartRight');
    const countSpan = document.getElementById('cartCount');
    const betTypeSpan = document.getElementById('cartBetType');

    const cartMinusBtn = document.getElementById('cartMinusBtn');
    const cartPlusBtn = document.getElementById('cartPlusBtn');
    const cartMinus1000Btn = document.getElementById('cartMinus1000Btn');
    const cartPlus1000Btn = document.getElementById('cartPlus1000Btn');
    const cartIssueBtn = document.getElementById('cartIssueBtn');

    if (cartItems.length > 0) {
        cartArea.style.display = 'flex';
        cartRight.style.display = 'flex';
    } else {
        cartArea.style.display = 'none';
    }

    itemsDiv.innerHTML = '';
    countSpan.textContent = `${cartItems.length}/3`;

    const mode = document.querySelector('input[name="displayMode"]:checked').value;
    cartItems.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'cart-item';

        const cleanName = (item.uma_name || '').replace('役', '').trim();
        const displayName = (mode === 'cast') ? item.cast_name : cleanName;

        el.innerHTML = `<span>${item.uma_number}. ${displayName}</span> <span class="cart-item-remove" data-index="${index}">×</span>`;
        itemsDiv.appendChild(el);
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-index');
            cartItems.splice(idx, 1);
            updateCartUI();
        });
    });

    const isReady = cartItems.length >= 2;

    if (cartItems.length === 2) {
        betTypeSpan.textContent = 'ウマ連';
    } else if (cartItems.length === 3) {
        betTypeSpan.textContent = '3連複';
    } else {
        betTypeSpan.textContent = '';
    }

    cartPlusBtn.disabled = !isReady;
    cartPlus1000Btn.disabled = !isReady;
    cartIssueBtn.disabled = !isReady;

    cartMinusBtn.disabled = !isReady || cartAmount <= 100;
    cartMinus1000Btn.disabled = !isReady || cartAmount <= 100;

    document.querySelectorAll('.item-card').forEach(card => {
        const castName = card.dataset.castName;
        if (cartItems.some(item => item.cast_name === castName)) {
            card.classList.add('checked-row');
        } else {
            card.classList.remove('checked-row');
        }
    });
}

function addToCart(rowData) {
    if (cartItems.length >= 3) {
        showToast('追加できるのは3人までです');
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
    updateCartUI();

    document.getElementById('cartQtySpan').textContent = cartAmount;
    showToast(`${rowData.cast_name} を追加しました`);
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

function hiraganaToKatakana(str) {
    return str.replace(/[\u3041-\u3096]/g, function (match) {
        const chr = match.charCodeAt(0) + 0x60;
        return String.fromCharCode(chr);
    });
}

function getMatches(keyword) {
    if (!keyword) return [];
    const katakanaKeyword = hiraganaToKatakana(keyword);
    return searchKeywordsArray.filter(k => {
        const kLower = k.toLowerCase();
        const isKatakana = /^[ァ-ヶー・ 　]+$/.test(k);
        if (isKatakana) {
            return kLower.includes(keyword) || kLower.includes(katakanaKeyword);
        }
        return kLower.includes(keyword);
    }).slice(0, 3);
}

const searchInput = document.getElementById('searchInput');
const clearInputBtn = document.getElementById('clearInputBtn');
const suggestionsBox = document.getElementById('suggestionsBox');

Papa.parse(umaCsvPath, {
    download: true, header: true, skipEmptyLines: true,
    complete: function (results) {
        allUmaData = results.data;

        const keywordsSet = new Set();
        allUmaData.forEach(row => {
            if (row.cast_name) keywordsSet.add(row.cast_name.trim());
            if (row.uma_name) keywordsSet.add(row.uma_name.replace('役', '').trim());
        });
        searchKeywordsArray = Array.from(keywordsSet).filter(k => k);

        applyFilters();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('itemList').style.display = 'flex';
    },
    error: function (err) {
        document.getElementById('loading').innerText = 'データの読み込みに失敗しました';
    }
});

function applyFilters() {
    const keyword = searchInput.value.toLowerCase().trim();
    const katakanaKeyword = hiraganaToKatakana(keyword);

    const activeFilters = {
        // dormitory: document.getElementById('dormitorySelect')?.value,
        // grade: document.getElementById('gradeSelect')?.value
    };

    const filteredData = allUmaData.filter(row => {
        // ① 属性フィルター判定
        // if (activeFilters.dormitory && row.dormitory !== activeFilters.dormitory) return false;

        // ② キーワード検索判定
        if (keyword) {
            const cast = (row.cast_name || '').toLowerCase();
            const uma = (row.uma_name || '').toLowerCase();
            return cast.includes(keyword) || uma.includes(keyword) || uma.includes(katakanaKeyword);
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
            selectSuggestion(matches[0]);
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

    const isSingleMatch = matches.length === 1;

    matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <span class="suggestion-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg></span>
                        ${match}
                    </div>
                    ${isSingleMatch ? '<span class="suggestion-enter-confirm" style="font-size: 0.75rem; color: #888; white-space: nowrap; margin-left: 10px;">Enterで確定</span>' : ''}
                `;
        div.addEventListener('click', () => {
            selectSuggestion(match);
        });
        suggestionsBox.appendChild(div);
    });
}

function setDisplayMode(mode) {
    const radio = document.querySelector(`input[name="displayMode"][value="${mode}"]`);
    if (radio && !radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
    }
}

function renderList(data) {
    const listContainer = document.getElementById('itemList');
    listContainer.innerHTML = '';
    if (data.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">該当するキャラクターがいません</div>`;
        return;
    }

    data.forEach((row, index) => {
        const key = row.uma_name;

        if (!ticketAmounts[key]) ticketAmounts[key] = 100;
        if (!ticketTypes[key]) ticketTypes[key] = 'ouen';
        if (!umaNumbers[key]) umaNumbers[key] = row.uma_number || 1;

        const cleanUmaName = (row.uma_name || '').replace('役', '').trim();
        const mainColor = row.main_color || '#333333';
        const subColor = row.sub_color || '#cccccc';
        const badgeStyle = `background: linear-gradient(135deg, ${mainColor} 75%, ${subColor} 25%);`;

        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.castName = row.cast_name;
        if (cartItems.some(item => item.cast_name === row.cast_name)) {
            card.classList.add('checked-row');
        }

        const leftDiv = document.createElement('div');
        leftDiv.className = 'card-left';

        const infoTopDiv = document.createElement('div');
        infoTopDiv.className = 'card-info-top';

        const badgesWrapper = document.createElement('div');
        badgesWrapper.className = 'badges-wrapper';

        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'uma-badge';
        badgeSpan.style.cssText = badgeStyle;
        badgeSpan.textContent = cleanUmaName;
        badgeSpan.addEventListener('click', () => setDisplayMode('uma'));

        const castDiv = document.createElement('div');
        castDiv.className = 'cast-name';
        castDiv.addEventListener('click', (e) => {
            if (e.target.tagName !== 'SELECT') {
                setDisplayMode('cast');
            }
        });

        const numberSelect = document.createElement('select');
        numberSelect.className = 'uma-number-select';
        for (let i = 1; i <= 32; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === parseInt(umaNumbers[key])) option.selected = true;
            numberSelect.appendChild(option);
        }
        numberSelect.addEventListener('change', (e) => {
            const newNum = e.target.value;
            umaNumbers[key] = newNum;
            cartItems.forEach(item => {
                if (item.uma_name === key) {
                    item.uma_number = newNum;
                }
            });
            updateCartUI();
        });

        const nameSpan = document.createElement('span');
        badgesWrapper.appendChild(badgeSpan);

        nameSpan.className = 'cast-name-text';
        nameSpan.textContent = row.cast_name;
        nameSpan.style.marginLeft = '8px';

        const customNumberSelect = buildCustomSelectMarkup(numberSelect, 'uma-number-select-wrapper');
        castDiv.appendChild(customNumberSelect);
        castDiv.appendChild(nameSpan);

        infoTopDiv.appendChild(badgesWrapper);
        infoTopDiv.appendChild(castDiv);

        const getTicketData = () => {
            return { ...row, uma_number: umaNumbers[key] };
        };

        const addCartLink = document.createElement('div');
        addCartLink.className = 'add-cart-link';
        addCartLink.innerHTML = `＋ ウマ連・3連複に追加`;
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
        const plusBtn = document.createElement('button');
        plusBtn.className = 'qty-btn'; plusBtn.textContent = '＋';

        const qtySubRow = document.createElement('div');
        qtySubRow.className = 'qty-sub-row';

        const minus1000Btn = document.createElement('button');
        minus1000Btn.className = 'qty-btn-small';
        minus1000Btn.textContent = '-1000';

        const plus1000Btn = document.createElement('button');
        plus1000Btn.className = 'qty-btn-small';
        plus1000Btn.textContent = '+1000';

        qtySubRow.appendChild(minus1000Btn);
        qtySubRow.appendChild(plus1000Btn);

        const updateQty = (newAmount) => {
            if (newAmount < 100) newAmount = 100;
            ticketAmounts[key] = newAmount;
            qtySpan.textContent = newAmount;
            minusBtn.disabled = newAmount <= 100;
            minus1000Btn.disabled = newAmount <= 100;
        };
        minusBtn.disabled = ticketAmounts[key] <= 100;
        minus1000Btn.disabled = ticketAmounts[key] <= 100;

        setupLongPress(minusBtn, () => updateQty(ticketAmounts[key] - 100));
        setupLongPress(plusBtn, () => updateQty(ticketAmounts[key] + 100));
        setupLongPress(minus1000Btn, () => updateQty(ticketAmounts[key] - 1000));
        setupLongPress(plus1000Btn, () => updateQty(ticketAmounts[key] + 1000));

        qtyMainRow.appendChild(minusBtn);
        qtyMainRow.appendChild(qtySpan);
        qtyMainRow.appendChild(plusBtn);

        const betTypeSelect = document.createElement('select');
        betTypeSelect.className = 'bet-type-select';
        betTypeSelect.innerHTML = `
                    <option value="ouen">応援バ券 (単＋複)</option>
                    <option value="tansho">単勝</option>
                `;
        betTypeSelect.value = ticketTypes[key];
        betTypeSelect.addEventListener('change', (e) => {
            ticketTypes[key] = e.target.value;
        });

        const customBetTypeSelect = buildCustomSelectMarkup(betTypeSelect, 'bet-type-select-wrapper');
        amountControl.appendChild(customBetTypeSelect);
        amountControl.appendChild(qtyMainRow);
        amountControl.appendChild(qtySubRow);

        const issueBtn = document.createElement('button');
        issueBtn.className = 'issue-btn';
        issueBtn.innerHTML = `発券`;
        issueBtn.addEventListener('click', () => generateTicket(getTicketData(), ticketAmounts[key], ticketTypes[key]));

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

async function generateTicket(data, amount, betType, isReissue = false) {
    shareModal.classList.add('show');
    shareImageLoading.style.display = 'block';
    shareImagePreview.style.display = 'none';

    applyBakenThemeColor(data);

    const now = new Date();
    const issueMonth = now.getMonth() + 1;
    const issueDay = now.getDate();
    document.getElementById('bkIssueDateVal').textContent = `${issueMonth}月${issueDay}日`;

    const d = eventSettings.date.split('-');
    const eventYear = d[0];
    const eventMonth = parseInt(d[1], 10);
    const eventDay = parseInt(d[2], 10);
    document.getElementById('bkSlipDate').textContent = `${eventYear}年${eventMonth}月${eventDay}日`;

    let venueDisp = eventSettings.racecourse;
    if (venueDisp.length === 2) {
        venueDisp = '\u00A0' + venueDisp[0] + '\u00A0\u00A0\u00A0' + venueDisp[1];
    }
    document.getElementById('bkSlipVenue').textContent = venueDisp;

    document.getElementById('bkSlipRaceNumber').textContent = eventSettings.raceNumber;
    document.getElementById('bkSlipRaceTitle').innerHTML = `${formatBakenRaceName(eventSettings.raceName)}<br>(${eventSettings.grade})`;

    const isMulti = Array.isArray(data);
    const firstData = isMulti ? data[0] : data;
    const cleanUmaName = (firstData.uma_name || '').replace('役', '').trim();

    let totalAmount = amount;

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

    const getStars = (val, isTotal) => {
        const char = isTotal ? '★' : '☆';
        const targetLength = isTotal ? 7 : 6;
        const starCount = Math.max(0, targetLength - val.toString().length);
        return char.repeat(starCount);
    };

    document.getElementById('bkVal').textContent = amount;

    const amountRow = document.querySelector('.bk-amount-row');
    const totalRow = document.querySelector('.bk-total-row');

    if (isMulti) {
        if (amountRow) {
            amountRow.style.transform = 'scale(0.85)';
            amountRow.style.transformOrigin = 'right bottom';
            amountRow.style.marginBottom = '-10px';
        }
        if (totalRow) {
            totalRow.style.transform = 'scale(0.85)';
            totalRow.style.transformOrigin = 'right bottom';
        }
    } else {
        if (amountRow) {
            amountRow.style.transform = 'none';
            amountRow.style.marginBottom = '5px';
        }
        if (totalRow) totalRow.style.transform = 'none';
    }

    document.getElementById('bkStarsSub').textContent = getStars(amount, false);
    document.getElementById('bkTotalVal').textContent = totalAmount;
    document.getElementById('bkStarsTotal').textContent = getStars(totalAmount, true);

    if (isMulti) {
        let multiHtml = `<div class="multi-names-container">`;
        data.forEach(row => {
            const cleanName = (row.uma_name || '').replace('役', '').trim();
            const mode = document.querySelector('input[name="displayMode"]:checked').value;

            let dispMain, dispSub;
            if (mode === 'cast') {
                dispMain = row.cast_name;
                dispSub = `${cleanName}役`;
            } else {
                dispMain = cleanName;
                dispSub = `CV: ${row.cast_name}`;
            }

            const scaleMain = getScaleVar(dispMain, 6, 1);
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
        const cleanUmaName = (firstData.uma_name || '').replace('役', '').trim();
        const mode = document.querySelector('input[name="displayMode"]:checked').value;

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
            showToast('エラー：不正な値が検出されました');
            return;
        }

        const canvas = await captureBakenSlip(bakenDOM);
        const imgDataUrl = canvas.toDataURL('image/png');

        shareImagePreview.src = imgDataUrl;
        shareImageLoading.style.display = 'none';
        shareImagePreview.style.display = 'block';

        let castNamesText = "";
        const tweetMode = document.querySelector('input[name="displayMode"]:checked').value;

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

        const tweetText = `推しバ券を発券しました！\n\n${castNamesText}、がんばれ！\n\n#推しバ券メーカー\nhttps://nyaftama.github.io/uma-ouen-baken/`;
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
        historyList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">履歴がありません</div>';
        return;
    }

    const mode = document.querySelector('input[name="displayMode"]:checked').value;

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

        let eventInfoStr = 'ーーー';
        if (entry.eventInfo) {
            const formattedDate = entry.eventInfo.date.replace(/-/g, '/');
            eventInfoStr = `${formattedDate} | ${entry.eventInfo.racecourse} | ${entry.eventInfo.raceNumber}R | ${entry.eventInfo.grade} | ${entry.eventInfo.raceName}`;
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
                    
                    <label class="history-checkbox-wrapper">
                        <input type="checkbox" class="history-checkbox" value="${entry.id}">
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
    document.querySelectorAll('.history-checkbox').forEach(cb => cb.checked = isAllSelected);
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
    const selectedIds = Array.from(document.querySelectorAll('.history-checkbox:checked')).map(cb => cb.value);
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
            const tweetMode = document.querySelector('input[name="displayMode"]:checked').value;

            for (const comboData of target.combinations) {
                applyBakenThemeColor(comboData);

                const isMulti = Array.isArray(comboData);
                const firstData = isMulti ? comboData[0] : comboData;

                const now = new Date();
                const issueMonth = now.getMonth() + 1;
                const issueDay = now.getDate();
                document.getElementById('bkIssueDateVal').textContent = `${issueMonth}月${issueDay}日`;

                const d = currentEvent.date.split('-');
                const eventYear = d[0];
                const eventMonth = parseInt(d[1], 10);
                const eventDay = parseInt(d[2], 10);
                document.getElementById('bkSlipDate').textContent = `${eventYear}年${eventMonth}月${eventDay}日`;

                let venueDisp = currentEvent.racecourse;
                if (venueDisp.length === 2) {
                    venueDisp = venueDisp[0] + ' ' + venueDisp[1];
                }
                document.getElementById('bkSlipVenue').textContent = venueDisp;
                document.getElementById('bkSlipRaceNumber').textContent = currentEvent.raceNumber;
                document.getElementById('bkSlipRaceTitle').innerHTML = `${formatBakenRaceName(currentEvent.raceName)}<br>(${currentEvent.grade})`;

                let totalAmount = target.amount;
                const betType = target.betType;
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
                    totalAmount = target.amount;
                } else {
                    bkBetTypeBox.innerHTML = `<div class="bk-small-en">WIN</div><div class="bk-vert-text">単<br>勝</div><div class="bk-plus">＋</div><div class="bk-vert-text">複<br>勝</div><div class="bk-small-en">PLACE<br>SHOW</div>`;
                    bkMessage.style.display = 'block';
                    bkMessage.textContent = 'がんばれ！';
                    totalAmount = target.amount * 2;
                }

                document.getElementById('bkVal').textContent = target.amount;

                const amountRow = document.querySelector('.bk-amount-row');
                const totalRow = document.querySelector('.bk-total-row');

                if (isMulti) {
                    if (amountRow) {
                        amountRow.style.transform = 'scale(0.85)';
                        amountRow.style.transformOrigin = 'right bottom';
                        amountRow.style.marginBottom = '-10px';
                    }
                    if (totalRow) {
                        totalRow.style.transform = 'scale(0.85)';
                        totalRow.style.transformOrigin = 'right bottom';
                    }
                } else {
                    if (amountRow) {
                        amountRow.style.transform = 'none';
                        amountRow.style.marginBottom = '5px';
                    }
                    if (totalRow) totalRow.style.transform = 'none';
                }

                const getStars = (val, isTotal) => {
                    const char = isTotal ? '★' : '☆';
                    const targetLength = isTotal ? 7 : 6;
                    const starCount = Math.max(0, targetLength - val.toString().length);
                    return char.repeat(starCount);
                };

                document.getElementById('bkStarsSub').textContent = getStars(target.amount, false);
                document.getElementById('bkTotalVal').textContent = totalAmount;
                document.getElementById('bkStarsTotal').textContent = getStars(totalAmount, true);

                if (isMulti) {
                    let multiHtml = `<div class="multi-names-container">`;
                    comboData.forEach(row => {
                        const cleanName = (row.uma_name || '').replace('役', '').trim();
                        let dispMain, dispSub;
                        if (tweetMode === 'cast') {
                            dispMain = row.cast_name;
                            dispSub = `${cleanName}役`;
                        } else {
                            dispMain = cleanName;
                            dispSub = `CV: ${row.cast_name}`;
                        }

                        const scaleMain = getScaleVar(dispMain, 6, 1);
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
                    const cleanUmaName = (firstData.uma_name || '').replace('役', '').trim();
                    let dispMain, dispSub;
                    if (tweetMode === 'cast') {
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
});

const updateCartQty = (newAmount) => {
    if (newAmount < 100) newAmount = 100;
    cartAmount = newAmount;
    document.getElementById('cartQtySpan').textContent = cartAmount;

    const isReady = cartItems.length >= 2;
    document.getElementById('cartMinusBtn').disabled = !isReady || cartAmount <= 100;
    document.getElementById('cartMinus1000Btn').disabled = !isReady || cartAmount <= 100;
};

setupLongPress(document.getElementById('cartMinusBtn'), () => updateCartQty(cartAmount - 100));
setupLongPress(document.getElementById('cartPlusBtn'), () => updateCartQty(cartAmount + 100));
setupLongPress(document.getElementById('cartMinus1000Btn'), () => updateCartQty(cartAmount - 1000));
setupLongPress(document.getElementById('cartPlus1000Btn'), () => updateCartQty(cartAmount + 1000));

document.getElementById('cartIssueBtn').addEventListener('click', () => {
    const betType = cartItems.length === 2 ? 'umaren' : 'sanrenpuku';
    generateTicket(cartItems, cartAmount, betType);
});

document.getElementById('openHistoryFromShare').addEventListener('click', (e) => {
    e.preventDefault();
    shareModal.classList.remove('show');
    renderHistoryList();
    historyModal.classList.add('show');
});

let eventSettings = {
    date: '2021-02-24',
    racecourse: '東京',
    raceNumber: '11',
    grade: 'GI',
    raceName: 'トゥインクルシリーズ'
};

function updateEventSettingsUI() {
    const formattedDate = eventSettings.date.replace(/-/g, '/');
    document.getElementById('currentEventInfo').textContent =
        `${formattedDate} | ${eventSettings.racecourse} | ${eventSettings.raceNumber}R | ${eventSettings.grade} | ${eventSettings.raceName}`;
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

        const matches = optionsList.filter(name => name.toLowerCase().includes(keyword)).slice(0, 5);

        if (matches.length === 0) {
            boxEl.style.display = 'none';
            return;
        }

        boxEl.style.display = 'block';
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = match;

            div.addEventListener('click', () => {
                inputEl.value = match;
                boxEl.innerHTML = '';
                boxEl.style.display = 'none';
                clearBtn.style.display = 'block';
            });
            boxEl.appendChild(div);
        });
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

async function initEventSettings() {
    const raceNumSelect = document.getElementById('setRaceNumber');
    for (let i = 1; i <= 13; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}R`;
        if (String(i) === eventSettings.raceNumber) opt.selected = true;
        raceNumSelect.appendChild(opt);
    }

    try {
        const response = await fetch('./data/option_list.json?v=' + version);
        const options = await response.json();

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
            }).format(date);
        }

        eventSettings.date = getNextSunday();

        const courseSelect = document.getElementById('setRacecourse');
        options.racecourse_name.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if (name === eventSettings.racecourse) opt.selected = true;
            courseSelect.appendChild(opt);
        });

        const gradeSelect = document.getElementById('setGrade');
        options.grade_name.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if (name === eventSettings.grade) opt.selected = true;
            gradeSelect.appendChild(opt);
        });

        setupRaceNameSuggestion(options.race_name);

        const raceListModal = document.getElementById('raceListModal');
        const raceGridContainer = document.getElementById('raceGridContainer');

        options.race_name.forEach(name => {
            const item = document.createElement('div');
            item.className = 'race-grid-item';
            item.textContent = name;

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

                raceListModal.classList.remove('show');
            });
            raceGridContainer.appendChild(item);
        });

        document.getElementById('openRaceListBtn').addEventListener('click', (e) => {
            e.preventDefault();
            raceListModal.classList.add('show');
        });

        document.getElementById('closeRaceListBtn').addEventListener('click', () => {
            raceListModal.classList.remove('show');
        });

    } catch (error) {
        console.error('オプションリストの読み込みに失敗しました:', error);
    }

    document.getElementById('setEventDate').value = eventSettings.date;
    updateEventSettingsUI();
    setupCustomSelectsAndDatePicker();
}

document.getElementById('openSettingsBtn').addEventListener('click', () => {
    document.getElementById('setEventDate').value = eventSettings.date;
    document.getElementById('setRacecourse').value = eventSettings.racecourse;
    document.getElementById('setRaceNumber').value = eventSettings.raceNumber;
    document.getElementById('setGrade').value = eventSettings.grade;
    document.getElementById('setRaceName').value = eventSettings.raceName;

    // Sync custom elements trigger texts and selection marks
    syncCustomDatePickerUI();
    syncCustomSelectUI('setRacecourse');
    syncCustomSelectUI('setRaceNumber');
    syncCustomSelectUI('setGrade');

    const currentRaceName = document.getElementById('setRaceName').value;
    document.getElementById('clearRaceInputBtn').style.display = currentRaceName ? 'block' : 'none';
    document.getElementById('settingsModal').classList.add('show');
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('show');
});

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const inputDate = document.getElementById('setEventDate').value;
    const inputRaceName = document.getElementById('setRaceName').value;

    if (!inputDate) {
        showToast('エラー：開催日を入力してください');
        return;
    }

    const response = await fetch('./data/option_list.json?v=' + version);
    const options = await response.json();

    if (!options.race_name.includes(inputRaceName)) {
        showToast('エラー：リストに存在しないレース名です');
        return;
    }

    eventSettings.date = inputDate;
    eventSettings.racecourse = document.getElementById('setRacecourse').value;
    eventSettings.raceNumber = document.getElementById('setRaceNumber').value;
    eventSettings.grade = document.getElementById('setGrade').value;
    eventSettings.raceName = inputRaceName;

    updateEventSettingsUI();
    document.getElementById('settingsModal').classList.remove('show');
    showToast('開催情報を更新しました');
});

document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const mode = e.target.value;
        const modeName = (mode === 'cast') ? 'キャスト名優先' : 'キャラ名優先';

        showToast('表示モードを切り替え中...', 2000);

        setTimeout(() => {
            document.body.setAttribute('data-display-mode', mode);
            updateCartUI();
            if (typeof renderHistoryList === 'function') renderHistoryList();

            showToast(`${modeName}モードに切り替えました`);
        }, 50);
    });
});
document.body.setAttribute('data-display-mode', document.querySelector('input[name="displayMode"]:checked').value);

initEventSettings();



async function captureBakenSlip(bakenDOM) {
    if (advancedSettings.bitmapText) {
        bakenDOM.classList.add('capture-bg-only');
        const bgCanvas = await html2canvas(bakenDOM, {
            scale: 3,
            useCORS: true,
            logging: false
        });
        bakenDOM.classList.remove('capture-bg-only');

        bakenDOM.classList.add('capture-text-only');
        const textCanvas = await html2canvas(bakenDOM, {
            scale: 1.25,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false
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
            scale: 3,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false
        });
    }
}

/* Custom UI Inputs Support Logic */

function setupCustomSelectsAndDatePicker() {
    const selectIds = ['setRacecourse', 'setRaceNumber', 'setGrade'];
    selectIds.forEach(id => {
        setupCustomSelect(id);
    });

    setupCustomDatePicker();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper') && !e.target.closest('.calendar-wrapper')) {
            closeAllCustomDropdowns();
        }
    });
}

function setupCustomSelect(selectId) {
    const nativeSelect = document.getElementById(selectId);
    if (!nativeSelect) return;

    const wrapper = document.getElementById(selectId + 'Wrapper');
    const trigger = document.getElementById(selectId + 'Btn');
    const optionsContainer = document.getElementById(selectId + 'Options');
    if (!wrapper || !trigger || !optionsContainer) return;

    // Clear and rebuild options list
    optionsContainer.innerHTML = '';

    Array.from(nativeSelect.options).forEach(opt => {
        const customOpt = document.createElement('div');
        customOpt.className = 'custom-select-option';
        customOpt.role = 'option';
        customOpt.dataset.value = opt.value;
        customOpt.textContent = opt.textContent;

        if (opt.selected) {
            customOpt.classList.add('selected');
            trigger.querySelector('span').textContent = opt.textContent;
        }

        customOpt.addEventListener('click', (e) => {
            e.stopPropagation();
            nativeSelect.value = opt.value;

            // Dispatch change event on native element so event handlers run
            const changeEvent = new Event('change', { bubbles: true });
            nativeSelect.dispatchEvent(changeEvent);

            syncCustomSelectUI(selectId);
            closeAllCustomDropdowns();
        });

        optionsContainer.appendChild(customOpt);
    });

    // Toggle dropdown visibility
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = optionsContainer.classList.contains('open');
        closeAllCustomDropdowns();
        if (!isOpen) {
            trigger.classList.add('active');
            optionsContainer.classList.add('open');
        }
    });

    // Keyboard accessibility navigation
    trigger.addEventListener('keydown', (e) => {
        const isOpen = optionsContainer.classList.contains('open');
        const items = Array.from(optionsContainer.querySelectorAll('.custom-select-option'));
        let index = items.findIndex(item => item.classList.contains('highlighted'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                trigger.click();
            } else {
                if (index < items.length - 1) {
                    items.forEach(el => el.classList.remove('highlighted'));
                    index++;
                    items[index].classList.add('highlighted');
                    items[index].scrollIntoView({ block: 'nearest' });
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen && index > 0) {
                items.forEach(el => el.classList.remove('highlighted'));
                index--;
                items[index].classList.add('highlighted');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen && index >= 0) {
                items[index].click();
            } else {
                trigger.click();
            }
        } else if (e.key === 'Escape') {
            if (isOpen) {
                closeAllCustomDropdowns();
                trigger.focus();
            }
        }
    });
}

function syncCustomSelectUI(selectId) {
    const nativeSelect = document.getElementById(selectId);
    if (!nativeSelect) return;

    const trigger = document.getElementById(selectId + 'Btn');
    const optionsContainer = document.getElementById(selectId + 'Options');
    if (!trigger || !optionsContainer) return;

    const selectedVal = nativeSelect.value;
    const items = Array.from(optionsContainer.querySelectorAll('.custom-select-option'));

    let matchedText = '選択してください';
    items.forEach(item => {
        if (item.dataset.value === selectedVal) {
            item.classList.add('selected');
            matchedText = item.textContent;
        } else {
            item.classList.remove('selected');
        }
    });

    trigger.querySelector('span').textContent = matchedText;
}

function setupCustomDatePicker() {
    const dateInput = document.getElementById('setEventDate');
    const trigger = document.getElementById('setEventDateBtn');
    const popover = document.getElementById('setEventDatePopover');
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');
    const grid = document.getElementById('setEventDateGrid');

    if (!dateInput || !trigger || !popover || !grid) return;

    let viewDate = new Date();
    if (dateInput.value) {
        viewDate = new Date(dateInput.value);
    }
    let viewYear = viewDate.getFullYear();
    let viewMonth = viewDate.getMonth();

    const yearBtn = document.getElementById('calYearSelectBtn');
    const yearOptions = document.getElementById('calYearSelectOptions');

    function populateYearDropdown() {
        yearOptions.innerHTML = '';
        const startYear = 1900;
        const endYear = 2100;

        for (let y = startYear; y <= endYear; y++) {
            const opt = document.createElement('div');
            opt.className = 'cal-header-select-option';
            opt.textContent = `${y}年`;
            opt.dataset.value = y;
            if (y === viewYear) {
                opt.classList.add('selected');
                yearBtn.querySelector('span').textContent = `${y}年`;
            }
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                viewYear = y;
                yearOptions.classList.remove('open');
                yearBtn.classList.remove('active');
                renderCalDays();
                updateHeaderSelectsUI();
            });
            yearOptions.appendChild(opt);
        }
    }

    yearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = yearOptions.classList.contains('open');
        closeAllHeaderSelects();
        if (!isOpen) {
            yearBtn.classList.add('active');
            yearOptions.classList.add('open');

            // Auto-scroll selected year into view
            const selectedOpt = yearOptions.querySelector('.cal-header-select-option.selected');
            if (selectedOpt) {
                setTimeout(() => {
                    selectedOpt.scrollIntoView({ block: 'nearest', behavior: 'auto' });
                }, 10);
            }
        }
    });

    const monthBtn = document.getElementById('calMonthSelectBtn');
    const monthOptions = document.getElementById('calMonthSelectOptions');

    function populateMonthDropdown() {
        monthOptions.innerHTML = '';
        for (let m = 0; m < 12; m++) {
            const opt = document.createElement('div');
            opt.className = 'cal-header-select-option';
            opt.textContent = `${m + 1}月`;
            opt.dataset.value = m;
            if (m === viewMonth) {
                opt.classList.add('selected');
                monthBtn.querySelector('span').textContent = `${m + 1}月`;
            }
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                viewMonth = m;
                monthOptions.classList.remove('open');
                monthBtn.classList.remove('active');
                renderCalDays();
                updateHeaderSelectsUI();
            });
            monthOptions.appendChild(opt);
        }
    }

    monthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = monthOptions.classList.contains('open');
        closeAllHeaderSelects();
        if (!isOpen) {
            monthBtn.classList.add('active');
            monthOptions.classList.add('open');
        }
    });

    function closeAllHeaderSelects() {
        yearOptions.classList.remove('open');
        yearBtn.classList.remove('active');
        monthOptions.classList.remove('open');
        monthBtn.classList.remove('active');
    }

    function updateHeaderSelectsUI() {
        Array.from(yearOptions.querySelectorAll('.cal-header-select-option')).forEach(el => {
            if (parseInt(el.dataset.value) === viewYear) {
                el.classList.add('selected');
                yearBtn.querySelector('span').textContent = `${viewYear}年`;
            } else {
                el.classList.remove('selected');
            }
        });

        Array.from(monthOptions.querySelectorAll('.cal-header-select-option')).forEach(el => {
            if (parseInt(el.dataset.value) === viewMonth) {
                el.classList.add('selected');
                monthBtn.querySelector('span').textContent = `${viewMonth + 1}月`;
            } else {
                el.classList.remove('selected');
            }
        });
    }

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllHeaderSelects();
        viewMonth--;
        if (viewMonth < 0) {
            viewMonth = 11;
            viewYear--;
        }
        renderCalDays();
        updateHeaderSelectsUI();
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllHeaderSelects();
        viewMonth++;
        if (viewMonth > 11) {
            viewMonth = 0;
            viewYear++;
        }
        renderCalDays();
        updateHeaderSelectsUI();
    });

    function renderCalDays() {
        grid.innerHTML = '';

        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell empty';
            grid.appendChild(cell);
        }

        const selectedDateStr = dateInput.value;
        const todayDateStr = new Date().toDateString();

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.textContent = day;

            const thisDate = new Date(viewYear, viewMonth, day);
            const thisDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (thisDate.toDateString() === todayDateStr) {
                cell.classList.add('today');
            }

            if (selectedDateStr === thisDateStr) {
                cell.classList.add('selected');
            }

            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                dateInput.value = thisDateStr;

                const changeEvent = new Event('change', { bubbles: true });
                dateInput.dispatchEvent(changeEvent);

                syncCustomDatePickerUI();
                closeAllCustomDropdowns();
            });

            grid.appendChild(cell);
        }
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = popover.classList.contains('open');
        closeAllCustomDropdowns();
        if (!isOpen) {
            trigger.classList.add('active');
            popover.classList.add('open');

            if (dateInput.value) {
                const curDate = new Date(dateInput.value);
                viewYear = curDate.getFullYear();
                viewMonth = curDate.getMonth();
            }
            populateYearDropdown();
            populateMonthDropdown();
            renderCalDays();
        }
    });

    populateYearDropdown();
    populateMonthDropdown();
    renderCalDays();
}

function syncCustomDatePickerUI() {
    const dateInput = document.getElementById('setEventDate');
    const trigger = document.getElementById('setEventDateBtn');
    if (!dateInput || !trigger) return;

    if (dateInput.value) {
        const formatted = dateInput.value.replace(/-/g, '/');
        document.getElementById('setEventDateVal').textContent = formatted;
    } else {
        document.getElementById('setEventDateVal').textContent = '日付を選択';
    }
}

function closeAllCustomDropdowns() {
    document.querySelectorAll('.custom-select-options, .calendar-popover, .cal-header-select-options').forEach(el => {
        el.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-trigger, .calendar-input-trigger, .cal-header-select-btn').forEach(el => {
        el.classList.remove('active');
    });
}

function buildCustomSelectMarkup(nativeSelect, wrapperClass = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper ' + wrapperClass;

    nativeSelect.classList.add('hidden-native-input');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerText = document.createElement('span');
    const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
    triggerText.textContent = selectedOpt ? selectedOpt.textContent : '選択してください';
    trigger.appendChild(triggerText);

    // Chevron SVG (no emoji)
    const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevronSvg.setAttribute('class', 'chevron-icon');
    chevronSvg.setAttribute('viewBox', '0 0 24 24');
    chevronSvg.setAttribute('width', '16');
    chevronSvg.setAttribute('height', '16');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7 10l5 5 5-5z');
    path.setAttribute('fill', 'currentColor');
    chevronSvg.appendChild(path);
    trigger.appendChild(chevronSvg);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';
    optionsContainer.setAttribute('role', 'listbox');

    function populateOptions() {
        optionsContainer.innerHTML = '';
        Array.from(nativeSelect.options).forEach(opt => {
            const customOpt = document.createElement('div');
            customOpt.className = 'custom-select-option';
            customOpt.role = 'option';
            customOpt.dataset.value = opt.value;
            customOpt.textContent = opt.textContent;

            if (opt.selected) {
                customOpt.classList.add('selected');
                triggerText.textContent = opt.textContent;
            }

            customOpt.addEventListener('click', (e) => {
                e.stopPropagation();
                nativeSelect.value = opt.value;

                const changeEvent = new Event('change', { bubbles: true });
                nativeSelect.dispatchEvent(changeEvent);

                triggerText.textContent = opt.textContent;
                Array.from(optionsContainer.querySelectorAll('.custom-select-option')).forEach(item => {
                    if (item.dataset.value === opt.value) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                });

                closeAllCustomDropdowns();
            });

            optionsContainer.appendChild(customOpt);
        });
    }

    populateOptions();

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = optionsContainer.classList.contains('open');
        closeAllCustomDropdowns();
        if (!isOpen) {
            trigger.classList.add('active');
            optionsContainer.classList.add('open');
            populateOptions();
        }
    });

    trigger.addEventListener('keydown', (e) => {
        const isOpen = optionsContainer.classList.contains('open');
        const items = Array.from(optionsContainer.querySelectorAll('.custom-select-option'));
        let index = items.findIndex(item => item.classList.contains('highlighted'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                trigger.click();
            } else {
                if (index < items.length - 1) {
                    items.forEach(el => el.classList.remove('highlighted'));
                    index++;
                    items[index].classList.add('highlighted');
                    items[index].scrollIntoView({ block: 'nearest' });
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen && index > 0) {
                items.forEach(el => el.classList.remove('highlighted'));
                index--;
                items[index].classList.add('highlighted');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen && index >= 0) {
                items[index].click();
            } else {
                trigger.click();
            }
        } else if (e.key === 'Escape') {
            if (isOpen) {
                closeAllCustomDropdowns();
                trigger.focus();
            }
        }
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsContainer);
    wrapper.appendChild(nativeSelect);

    return wrapper;
}
