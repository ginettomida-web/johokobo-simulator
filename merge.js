const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\tomida\\Desktop\\app.html';
const destPath = 'C:\\Users\\tomida\\.gemini\\antigravity\\scratch\\facilitypay\\index.html';

const content = fs.readFileSync(srcPath, 'utf8');
const parts = content.split('<!-- 施設利用料金シミュレーター（正確版） -->');
if (parts.length < 2) {
    console.error('Could not find separator');
    process.exit(1);
}

const dashboardHtml = parts[0];
const simulatorHtml = parts[1];

let headContent = '';
const headMatch = dashboardHtml.match(/<head>([\s\S]*?)<\/head>/);
if (headMatch) {
    headContent = headMatch[1];
}

let dashboardBody = '';
const dbBodyMatch = dashboardHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (dbBodyMatch) {
    dashboardBody = dbBodyMatch[1];
}

let simulatorBody = '';
const simBodyMatch = simulatorHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
if (simBodyMatch) {
    simulatorBody = simBodyMatch[1];
}

const newNav = `<nav class="flex-1 px-4 space-y-2" id="sidebar-nav">
                <a href="#simulator" data-target="simulator-view" class="nav-btn flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold transition-colors">
                    <span class="material-symbols-outlined">calculate</span>
                    <span>料金シミュレーター</span>
                </a>
                <a href="#dashboard" data-target="dashboard-view" class="nav-btn flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span class="material-symbols-outlined">dashboard</span>
                    <span>ダッシュボード</span>
                </a>`;

dashboardBody = dashboardBody.replace(
    /<nav class="flex-1 px-4 space-y-2">[\s\S]*?<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600[\s\S]*?<span>利用明細管理<\/span>\s*<\/a>\s*/m,
    newNav + '\n                '
);

dashboardBody = dashboardBody.replace(
    '<main class="flex-1 flex flex-col overflow-x-hidden">',
    '<main class="flex-1 flex flex-col overflow-x-hidden relative">'
);

const mainMatch = dashboardBody.match(/(<main class="flex-1 flex flex-col overflow-x-hidden relative">)([\s\S]*?)(<\/main>)/);
if (mainMatch) {
    const dashboardMainContent = mainMatch[2];
    const newMainContent = `
            <div id="simulator-view" class="absolute inset-0 overflow-x-hidden overflow-y-auto w-full bg-background-light dark:bg-background-dark flex flex-col z-10 transition-opacity duration-300">
                ${simulatorBody}
            </div>
            <div id="dashboard-view" class="hidden absolute inset-0 overflow-x-hidden overflow-y-auto w-full flex flex-col z-10 transition-opacity duration-300">
                ${dashboardMainContent}
            </div>
        `;
    dashboardBody = dashboardBody.substring(0, mainMatch.index + mainMatch[1].length) +
        newMainContent +
        dashboardBody.substring(mainMatch.index + mainMatch[1].length + mainMatch[2].length);
}

const newBtn = `
                                <button id="add-to-dashboard-btn" class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all mt-3">
                                    <span class="material-symbols-outlined">add_task</span>
                                    実績データとして追加
                                </button>
    `;

dashboardBody = dashboardBody.replace(
    'この条件で空きを確認\n                                </button>',
    'この条件で空きを確認\n                                </button>' + newBtn
);

// Inject IDs
dashboardBody = dashboardBody.replace(
    '<span class="text-3xl font-black">¥1,842,500</span>',
    '<span class="text-3xl font-black" id="dashboard-total">¥1,842,500</span>'
);
dashboardBody = dashboardBody.replace(
    '<tbody class="divide-y divide-slate-100 dark:divide-slate-800">',
    '<tbody class="divide-y divide-slate-100 dark:divide-slate-800" id="dashboard-table-body">'
);
dashboardBody = dashboardBody.replace(
    '<span class="text-4xl font-extrabold text-primary">¥6,280</span>',
    '<span class="text-4xl font-extrabold text-primary" id="sim-total-price">¥6,280</span>'
);
dashboardBody = dashboardBody.replace(
    '<span class="text-sm font-bold">スインクホール</span>',
    '<span class="text-sm font-bold" id="sim-room-name">スインクホール</span>'
);

let partsCounter = 0;
dashboardBody = dashboardBody.replace(
    /<input\s+class="w-24 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-primary"\s+min="0" type="number" value="0" \/>/g,
    (match) => {
        partsCounter++;
        if(partsCounter === 1) return '<input id="sim-cooler-hours"\n                                    class="w-24 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-primary"\n                                    min="0" type="number" value="0" />';
        if(partsCounter === 2) return '<input id="sim-heater-hours"\n                                    class="w-24 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-primary"\n                                    min="0" type="number" value="0" />';
        return match;
    }
);

// Room buttons logic ids
dashboardBody = dashboardBody.replace(/<button\s+class="[^"]*?flex flex-col gap-2 rounded-xl[^"]*?"(.*?)<span class="text-sm font-bold[^"]*?">(.*?)<\/span>/g, (match, prefix, roomName) => {
    return match.replace(/<button/, `<button class="sim-room-btn" data-room="${roomName}"`);
});

const finalHtml = `<!DOCTYPE html>
<html class="light" lang="ja">
<head>
    ${headContent}
    <style>
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-200">
    <!-- Combined layout -->
    ${dashboardBody}
    <script src="app.js"></script>
</body>
</html>`;

fs.writeFileSync(destPath, finalHtml, 'utf8');
console.log('Successfully wrote index.html');
