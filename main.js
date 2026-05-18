// --- 認証システム ---
const SECRET_WORD = "2026"; 

// 🔗 【重要】Google Apps Scriptで発行されたウェブアプリURLをここに貼り付けてください
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz73DrAYAMQJ-I4Mf5hE7MVBExVzeaT4D94bywqXJSPMYl9UtXCvyxn63mwE3BbCUDG/exec"; 

function checkPassword() {
    const input = document.getElementById('password-input').value;
    const error = document.getElementById('auth-error');
    if (input === SECRET_WORD) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        loadStockFromSpreadsheet(); // 認証成功時にスプレッドシートから在庫を読み込む
    } else {
        error.textContent = "合言葉が違います。";
    }
}

// --- タブ切り替えシステム ---
function switchTab(tabName) {
    if (tabName === 'prep') {
        document.getElementById('tab-prep').classList.add('active');
        document.getElementById('tab-stock').classList.remove('active');
        document.getElementById('content-prep').classList.remove('hidden');
        document.getElementById('content-stock').classList.add('hidden');
    } else {
        document.getElementById('tab-prep').classList.remove('active');
        document.getElementById('tab-stock').classList.add('active');
        document.getElementById('content-prep').classList.add('hidden');
        document.getElementById('content-stock').classList.remove('hidden');
        renderStockFields(); // 在庫画面を開くたびに最新の数値を再描写
    }
}

// --- 基本データ構造 ---
const netaMaster = [
    "マグロ", "生サーモン", "ヤリイカ", "ボイルエビ", "ネギトロ", 
    "いくら", "ウニ", "いたや貝", "焼きサーモン", "アナゴ", 
    "ツブ", "生エビ", "タイ", "ブリ", "赤エビ", 
    "北寄貝サラダ", "ノーカットたまご", "18カットたまご", "28カットたまご", "キュウリ", 
    "ヒラメ", "カレイ", "エンガワ", "ホタテ", "コウイカ", 
    "赤いか", "トラウトサーモン", "イカそうめん",
    "中トロ", "ズワイガニ", "うなぎ"
];

// 💡 必要に応じて、ネギトロや中トロなどの1パックあたりの容量（枚数やグラム数）もここに追加してください
const packSizeMaster = {
    "マグロ": 10, "赤エビ": 10, "ヤリイカ": 20, "ボイルエビ": 20, "焼きサーモン": 20,
    "アナゴ": 20, "ツブ": 20, "生エビ": 20, "ヒラメ": 20, "カレイ": 20,
    "ホタテ": 20, "コウイカ": 20, "赤いか": 20, "トラウトサーモン": 20, "エンガワ": 20,
    "ウニ": 12, "18カットたまご": 1, "28カットたまご": 1, "ノーカットたまご": 1, "キュウリ": 1,
    "いくら": 120, "いたや貝": 25, "ズワイガニ": 20, "うなぎ": 20
};

// 在庫データ（初期値は100ですが、スプレッドシートの通信が成功すると上書きされます）
let stockMaster = {};
netaMaster.forEach(neta => {
    stockMaster[neta] = 100; 
});

// --- スプレッドシートから在庫を取得する関数 ---
async function loadStockFromSpreadsheet() {
    try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error('通信エラーが発生しました');
        const remoteStock = await response.json();
        
        // 取得したデータで在庫を更新
        for (let neta in remoteStock) {
            if (stockMaster.hasOwnProperty(neta)) {
                stockMaster[neta] = remoteStock[neta];
            }
        }
        console.log("スプレッドシートから最新在庫を同期しました", stockMaster);
    } catch (error) {
        alert("🚨 スプレッドシートからの在庫同期に失敗しました。オフラインモード（初期値100）で起動します。\n理由: " + error.message);
    }
}

// --- スプレッドシートへ最新在庫を保存する関数 ---
async function saveStockToSpreadsheet() {
    try {
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" }, 
            body: JSON.stringify(stockMaster)
        });
        if (!response.ok) throw new Error('保存通信エラー');
        console.log("スプレッドシートへ在庫データを送信しました");
    } catch (error) {
        alert("🚨 スプレッドシートへのデータ保存に失敗しました。画面上の数値のみ更新されています。");
    }
}

// --- レシピデータ ---
const recipeData = [
    { id: 'nama_salmon_iri', name: '生サーモン入り', ratio: { "生サーモン": 2, "マグロ": 2, "ヤリイカ": 2, "ボイルエビ": 2, "ネギトロ": 2, "アナゴ": 2 } },
    { id: 'kita_no_megumi', name: '北の恵み', ratio: { "マグロ": 2, "ホタテ": 2, "生サーモン": 2, "いくら": 2, "ウニ": 2, "いたや貝": 2, "ツブ": 2 } },
    { id: 'hokkai_zukushi', name: '北海尽くし', ratio: { "生サーモン": 1, "赤エビ": 6, "いくら": 1, "ウニ": 1, "いたや貝": 1, "ツブ": 1 } },
    { id: 'kan_24', name: '24貫入り', ratio: { "ブリ": 2, "ヒラメ": 2, "マグロ": 4, "生エビ": 2, "いくら": 2, "ウニ": 2, "北寄貝サラダ": 2, "生サーモン": 4, "エンガワ": 2, "アナゴ": 2 } },
    { id: 'salmon_aburi', name: 'サーモン炙り', ratio: { "トラウトサーモン": 2, "生サーモン": 3 } },
    { id: 'ika_3shu', name: 'イカ3種', ratio: { "ヤリイカ": 2, "コウイカ": 2 } },
    { id: 'kan_12', name: '12貫入り', ratio: { "マグロ": 1, "赤いか": 1, "タイ": 1, "生サーモン": 1, "エンガワ": 2, "ボイルエビ": 1, "カレイ": 1, "ウニ": 0.5, "いたや貝": 0.5, "ネギトロ": 0.5, "いくら": 0.5, "アナゴ": 1, "生エビ": 1 } },
    { id: 'kan_9', name: '9貫入り', ratio: { "ヤリイカ": 1, "マグロ": 1, "トラウトサーモン": 1, "カレイ": 1, "生エビ": 1, "焼きサーモン": 1, "ネギトロ": 1, "アナゴ": 1 } },
    { id: 'salmon_big_1', name: 'サーモン大パック①', ratio: { "生サーモン": 16 } },
    { id: 'salmon_big_2', name: 'サーモン大パック②', ratio: { "生サーモン": 8 } },
    { id: 'ebi_aburi', name: 'エビ炙り', ratio: { "ボイルエビ": 3, "生エビ": 2 } },
    { id: 'salmon_combi', name: 'サーモンコンビ', ratio: { "焼きサーモン": 6, "生サーモン": 6 } },
    { id: 'seven_don', name: '7種の海鮮丼', ratio: { "イカそうめん": 1/20, "いたや貝": 1.5, "アナゴ": 1, "焼きサーモン": 1, "28カットたまご": 1 / 56 } },
    { id: 'don_nami', name: '海鮮丼並', ratio: { "28カットたまご": 1 / 28 } },
    { id: 'don_sho', name: '海鮮丼小', ratio: { "28カットたまご": 1 / 28 } },
    { id: 'one_pound_maki', name: '1ポンド海鮮巻き', ratio: { "ノーカットたまご": 1 / 8, "キュウリ": 1 / 8 } },
    { id: 'half_pound_maki', name: '2分の1ポンド海鮮巻き', ratio: { "ノーカットたまご": 1 / 16, "キュウリ": 1 / 8 } },
    { id: 'kanikama_maki', name: 'かにかま玉子巻き', ratio: { "ノーカットたまご": 1 / 4 } },
    { id: 'salmon_salad_maki', name: 'サーモンサラダ巻き', ratio: { "キュウリ": 1 / 8, "18カットたまご": 1 / 18 } },
    { id: 'otoku_lunch', name: 'お得ランチ寿司', ratio: { "トラウトサーモン": 1, "マグロ": 1, "ヤリイカ": 1, "ボイルエビ": 1, "カレイ": 1, "ネギトロ": 1, "アナゴ": 1 } },
    { id: 'moriawase_10', name: '盛り合わせ10貫', ratio: { "赤いか": 1, "マグロ": 1, "生エビ": 1, "生サーモン": 1, "タイ": 1, "エンガワ": 1, "いたや貝": 1, "ネギトロ": 1, "ボイルエビ": 1, "アナゴ": 1 } },
    { id: 'chutoro_13', name: '中とろ入り13貫', ratio: { "マグロ": 1, "中トロ": 1, "タイ": 1, "生サーモン": 2, "生エビ": 1, "エンガワ": 1, "いくら": 0.5, "ウニ": 0.5, "ネギトロ": 1, "コウイカ": 1, "ボイルエビ": 1, "アナゴ": 1 } },
    { id: 'kan_18', name: '18貫入り', ratio: { "トラウトサーモン": 2, "ズワイガニ": 2, "赤いか": 2, "生エビ": 2, "アナゴ": 2, "ネギトロ": 2, "ウニ": 2, "28カットたまご": 1 / 14 } },
    { id: 'baibai_maguro', name: '倍倍マグロ', ratio: { "マグロ": 16 } },
    { id: 'baibai_salmon', name: '倍倍サーモン', ratio: { "生サーモン": 16 } },
    { id: 'bai_maguro_salmon', name: '倍マグロサーモン', ratio: { "マグロ": 4, "生サーモン": 4 } },
    { id: 'bai_salmon', name: '倍サーモン', ratio: { "生サーモン": 8 } },
    { id: 'bai_maguro', name: '倍マグロ', ratio: { "マグロ": 8 } },
    { id: 'unagi_kabayaki', name: 'うなぎかば焼き', ratio: { "うなぎ": 5 } },
    { id: 'unagi_10', name: 'うなぎ10貫', ratio: { "うなぎ": 10 } }
];

// --- 画面初期化（商品入力欄の生成） ---
const inputFields = document.getElementById('input-fields');
recipeData.forEach(item => {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `<div class="item-info"><label>${item.name}</label><span>RECIPE OK</span></div>
        <input type="number" id="input-${item.id}" min="0" placeholder="0" inputmode="numeric">`;
    inputFields.appendChild(row);
});

// --- 計算ロジック ---
let lastCalculatedTotals = {}; 

function calculateTotal() {
    netaMaster.forEach(name => lastCalculatedTotals[name] = 0);
    let hasInput = false;

    recipeData.forEach(product => {
        const qty = parseFloat(document.getElementById(`input-${product.id}`).value) || 0;
        if (qty > 0) {
            hasInput = true;
            for (let name in product.ratio) {
                if (lastCalculatedTotals.hasOwnProperty(name)) lastCalculatedTotals[name] += qty * product.ratio[name];
            }
        }
    });

    const container = document.getElementById('result-container');
    const details = document.getElementById('result-details');
    details.innerHTML = '';
    let grandTotal = 0;

    if (hasInput) {
        netaMaster.forEach(name => {
            const totalQty = lastCalculatedTotals[name];
            if (totalQty > 0) {
                grandTotal += totalQty;
                const roundedQty = Math.round(totalQty * 1000) / 1000;
                let displayText = `<span class="neta-count-main">${roundedQty}</span>`;
                if (packSizeMaster[name]) {
                    const size = packSizeMaster[name];
                    const packs = Math.floor(totalQty / size);
                    const remainder = Math.round((totalQty % size) * 1000) / 1000;
                    let packText = packs > 0 && remainder > 0 ? `[ ${packs}P + ${remainder}枚 ]` : (packs > 0 ? `[ ${packs}パック ]` : `[ 1パック未満 ]`);
                    displayText += `<span class="pack-info">${packText}</span>`;
                }
                details.innerHTML += `<p><span class="neta-name">${name}</span> <span>${displayText}</span></p>`;
            }
        });
        document.getElementById('total-count').textContent = Math.round(grandTotal * 1000) / 1000;
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert('注文数を入力してください');
    }
}

// 仕込み数を一括で在庫から引き算する機能
function applyPrepToStock() {
    let appliedCount = 0;
    for (let name in lastCalculatedTotals) {
        if (lastCalculatedTotals[name] > 0) {
            stockMaster[name] = Math.round((stockMaster[name] - lastCalculatedTotals[name]) * 1000) / 1000;
            // 💡 マイナス在庫を防止したい場合は以下のコメントアウトを解除してください
            // if (stockMaster[name] < 0) stockMaster[name] = 0;
            appliedCount++;
        }
    }
    if (appliedCount > 0) {
        saveStockToSpreadsheet(); 
        
        // 🛠️【修正バグ】UI側の表示もリアルタイムで最新パック数に更新する
        if (document.getElementById('content-stock').classList.contains('hidden') === false) {
            renderStockFields(); 
        }
        
        alert('仕込み分のネタ数を現在の在庫から引き算し、スプレッドシートを更新しました！\n「在庫管理」タブから確認できます。');
        resetForm();
    }
}

// 🛠️ 在庫数の表示を「端数なしの完全パック表記」のみに絞り込む関数
function getStockDisplayText(name, totalQty) {
    if (!packSizeMaster[name] || packSizeMaster[name] === 1) {
        // パック容量の設定がない、または1枚/1パック（玉子やキュウリなど）はそのまま整数（バラ）で表示
        return `${Math.round(totalQty)}`;
    }
    
    // パック数に綺麗に換算（端数・余り枚数は完全に非表示）
    const size = packSizeMaster[name];
    const packs = Math.floor(totalQty / size);
    
    if (packs > 0) {
        return `${packs} パック`;
    } else {
        return `0 パック`; // 1パックに満たない場合は0パックと表記
    }
}

// 在庫管理画面の項目を自動生成・描写する機能
function renderStockFields() {
    const stockFields = document.getElementById('stock-fields');
    stockFields.innerHTML = ''; 

    netaMaster.forEach((name, index) => {
        const row = document.createElement('div');
        row.className = 'input-row';
        
        // パック数での表示テキストを取得
        const displayStockText = getStockDisplayText(name, stockMaster[name]);
        
        row.innerHTML = `
            <div class="item-info">
                <label>${name}</label>
                <span>${packSizeMaster[name] && packSizeMaster[name] > 1 ? packSizeMaster[name] + '枚/1P' : 'バラ管理'}</span>
            </div>
            <div class="stock-status-box">
                <div>
                    <span class="current-stock-label">現在庫:</span>
                    <span class="current-stock-value" id="stock-val-${index}" style="font-size: 0.95em; font-weight: bold; color: #333;">${displayStockText}</span>
                </div>
                <div class="stock-io-area">
                    <span>＋</span><input type="number" id="stock-plus-${index}" class="input-stock-io" placeholder="0" min="0" inputmode="numeric">
                    <span>ー</span><input type="number" id="stock-minus-${index}" class="input-stock-io" placeholder="0" min="0" inputmode="numeric">
                    <button class="btn-stock-submit" onclick="updateSingleStock('${name}', ${index})">確定</button>
                </div>
            </div>
        `;
        stockFields.appendChild(row);
    });
}

// 個別の在庫を足し算・引き算する機能（※入力エリアは「パック数」で計算）
function updateSingleStock(netaName, index) {
    const plusInput = parseFloat(document.getElementById(`stock-plus-${index}`).value) || 0;
    const minusInput = parseFloat(document.getElementById(`stock-minus-${index}`).value) || 0;

    if (plusInput === 0 && minusInput === 0) {
        alert('数値を入力してください');
        return;
    }

    // 1パックあたりの容量を取得（設定がなければ1枚換算）
    const size = packSizeMaster[netaName] || 1;

    // 入力数値を「パック数 × 1Pの枚数」に内部で自動変換して計算
    const plusQty = plusInput * size;
    const minusQty = minusInput * size;

    let newStock = stockMaster[netaName] + plusQty - minusQty;
    stockMaster[netaName] = Math.round(newStock * 1000) / 1000;

    // 描写テキストを更新
    document.getElementById(`stock-val-${index}`).textContent = getStockDisplayText(netaName, stockMaster[netaName]);
    document.getElementById(`stock-plus-${index}`).value = '';
    document.getElementById(`stock-minus-${index}`).value = '';
    
    saveStockToSpreadsheet(); 
    alert(`${netaName} の在庫を更新し、スプレッドシートに同期しました！\n新しい在庫: ${getStockDisplayText(netaName, stockMaster[netaName])}`);
}

// リセット処理
function resetForm() {
    recipeData.forEach(item => document.getElementById(`input-${item.id}`).value = '');
    document.getElementById('result-container').classList.add('hidden');
    lastCalculatedTotals = {};
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
