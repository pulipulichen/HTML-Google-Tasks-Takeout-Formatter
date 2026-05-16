let generatedFiles = {};
let parsedListNames = []; // 儲存清單名稱，用於建立 ZIP 檔名

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const messageArea = document.getElementById('messageArea');
const messageIcon = document.getElementById('messageIcon');
const messageText = document.getElementById('messageText');
const resultArea = document.getElementById('resultArea');
const fileListElement = document.getElementById('fileList');
const downloadZipBtn = document.getElementById('downloadZipBtn');

// Show Notification
function showMessage(msg, type = 'error') {
    messageArea.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'bg-blue-50', 'text-blue-700', 'bg-green-50', 'text-green-700');
    messageIcon.className = 'ph text-xl mt-0.5';

    if (type === 'error') {
        messageArea.classList.add('bg-red-50', 'text-red-700');
        messageIcon.classList.add('ph-warning-circle');
    } else if (type === 'info') {
        messageArea.classList.add('bg-blue-50', 'text-blue-700');
        messageIcon.classList.add('ph-info');
    } else if (type === 'success') {
        messageArea.classList.add('bg-green-50', 'text-green-700');
        messageIcon.classList.add('ph-check-circle');
    }

    messageText.innerText = msg;
}

// CSV Escape function
function escapeCSV(str) {
    if (str == null) return "";
    let text = String(str);
    if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
        text = '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
}

// Sanitize Filename
function sanitizeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_');
}

// Handle File Reading
function handleFile(file) {
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showMessage("請上傳 .json 格式的檔案", "error");
        return;
    }

    showMessage(`正在處理檔案：${file.name}...`, "info");
    resultArea.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            processTasks(data);
        } catch (err) {
            showMessage("JSON 解析錯誤，請確認檔案內容格式是否正確。", "error");
            console.error(err);
        }
    };
    reader.onerror = function() {
        showMessage("讀取檔案失敗", "error");
    };
    reader.readAsText(file);
}

// Process Data Logic
function processTasks(data) {
    generatedFiles = {}; // Reset
    parsedListNames = []; // Reset list names
    
    if (!data.items || !Array.isArray(data.items)) {
        showMessage("找不到任務清單，請確認這是 Google Tasks 匯出的 JSON 檔。", "error");
        return;
    }

    let taskCount = 0;

    // Iterate through Task Lists
    data.items.forEach(list => {
        const listTitle = sanitizeFilename(list.title || "未命名清單");
        
        if (!parsedListNames.includes(listTitle)) {
            parsedListNames.push(listTitle);
        }

        if (list.items && Array.isArray(list.items)) {
            // Iterate through Tasks
            list.items.forEach(task => {
                const status = task.status || "needsAction";
                const filename = `${listTitle} - ${status}.csv`;
                
                const created = task.created || "";
                const scheduled_time = (task.scheduled_time && task.scheduled_time.length > 0) ? task.scheduled_time[0].start : "";
                const title = task.title || "";
                // Extracts link if present in the structured links array
                const link = (task.links && task.links.length > 0) ? task.links[0].link : "";
                const notes = task.notes || "";
                
                const row = [created, scheduled_time, title, link, notes].map(escapeCSV).join(",");
                
                // Initialize file with BOM and headers if it doesn't exist
                if (!generatedFiles[filename]) {
                    generatedFiles[filename] = '\uFEFFcreated,scheduled_time,title,link,notes\n';
                }
                
                generatedFiles[filename] += row + "\n";
                taskCount++;
            });
        }
    });

    if (taskCount === 0) {
        showMessage("檔案中沒有找到任何任務資料。", "error");
        return;
    }

    showMessage(`成功解析！共找到 ${taskCount} 筆任務，分為 ${Object.keys(generatedFiles).length} 個檔案。`, "success");
    displayFiles();
}

// Display Generated Files
function displayFiles() {
    fileListElement.innerHTML = ''; 
    const filenames = Object.keys(generatedFiles);
    
    filenames.forEach(filename => {
        const blob = new Blob([generatedFiles[filename]], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const li = document.createElement('li');
        li.className = "flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors";
        
        // Determine icon based on status
        const isCompleted = filename.includes('completed');
        const iconClass = isCompleted ? 'ph-check-circle text-green-500' : 'ph-clock text-orange-500';

        li.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <i class="ph-fill ${iconClass} text-2xl flex-shrink-0"></i>
                <span class="font-medium text-slate-700 truncate" title="${filename}">${filename}</span>
            </div>
            <a href="${url}" download="${filename}" class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <i class="ph-bold ph-download-simple"></i>
                下載
            </a>
        `;
        fileListElement.appendChild(li);
    });

    resultArea.classList.remove('hidden');
}

// Zip Download Logic
downloadZipBtn.addEventListener('click', function() {
    const zip = new JSZip();
    
    Object.keys(generatedFiles).forEach(filename => {
        zip.file(filename, generatedFiles[filename]);
    });
    
    const originalText = downloadZipBtn.innerHTML;
    downloadZipBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-lg"></i> 打包中...';
    downloadZipBtn.disabled = true;

    zip.generateAsync({ type: "blob" })
    .then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;

        // 產生動態檔案名稱
        const now = new Date();
        const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        
        let listPart = "Tasks";
        if (parsedListNames.length > 0) {
            // 取前兩個清單名稱作為檔名的一部分
            listPart = parsedListNames.slice(0, 2).join('_');
            if (parsedListNames.length > 2) {
                listPart += '_等';
            }
        }
        
        a.download = `GoogleTasks_${listPart}_${timeStr}.zip`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    })
    .finally(() => {
        downloadZipBtn.innerHTML = originalText;
        downloadZipBtn.disabled = false;
    });
});

// Drag and Drop Events
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});