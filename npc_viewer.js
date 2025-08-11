class NPCViewer {
    constructor() {
        this.npcData = {};
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupModal();
        // Try to auto-load after a short delay
        setTimeout(() => {
            this.autoLoadDatabase();
        }, 500);
    }

    bindEvents() {
        document.getElementById('refresh-data').addEventListener('click', () => this.loadData());
        document.getElementById('search-input').addEventListener('input', () => this.filterAndDisplay());
        document.getElementById('clear-search').addEventListener('click', () => this.clearSearch());
        document.getElementById('sort-by').addEventListener('change', () => this.filterAndDisplay());
        document.getElementById('filter-combat').addEventListener('change', () => this.filterAndDisplay());
    }

    triggerFileInput() {
        const fileInput = document.getElementById('file-input');
        fileInput.click();
    }

    async loadFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const loadButton = document.getElementById('load-file');
        const gridElement = document.getElementById('npc-grid');
        
        loadButton.disabled = true;
        loadButton.textContent = 'Loading...';
        gridElement.innerHTML = '<div class="col-span-full flex justify-center py-16"><div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div><p class="text-gray-600 dark:text-github-muted">Loading NPC database from file...</p></div></div>';

        try {
            const text = await file.text();
            this.npcData = JSON.parse(text);
            this.filteredData = Object.values(this.npcData);
            this.updateStats();
            this.filterAndDisplay();
            
            loadButton.textContent = 'Browse for JSON';
            console.log('Successfully loaded NPC data from file: - npc_viewer.js:51', file.name);
        } catch (error) {
            console.error('Error loading file: - npc_viewer.js:53', error);
            gridElement.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-github-surface rounded-xl border border-red-200 dark:border-red-800">
                    <div class="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-github-text mb-2">Error Loading File</h3>
                    <p class="text-red-600 dark:text-red-400 text-center max-w-md">
                        ${error.message}<br>
                        Please make sure it's a valid JSON file.
                    </p>
                </div>
            `;
        } finally {
            loadButton.disabled = false;
            event.target.value = '';
        }
    }

    async autoLoadDatabase() {
        console.log('Attempting to autoload database... - npc_viewer.js:75');
        try {
            await this.loadData();
        } catch (error) {
            console.log('Autoload failed, showing manual load option - npc_viewer.js:79');
            this.showLoadFailedMessage();
        }
    }

    showLoadFailedMessage() {
        const gridElement = document.getElementById('npc-grid');
        gridElement.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-github-surface rounded-xl border border-blue-200 dark:border-blue-800">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-github-text mb-2">Database Ready to Load</h3>
                <div class="text-center max-w-md space-y-3">
                    <p class="text-gray-600 dark:text-github-muted">
                        <strong class="text-blue-600 dark:text-blue-400">npc_database.json</strong> detected in directory
                    </p>
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
                            <strong>Note:</strong>
                        </p>
                        <p class="text-xs text-blue-700 dark:text-blue-300">
                            Click "Refresh Database" to load all NPCs with pagination (50 per page)
                        </p>
                    </div>
                    <button onclick="document.getElementById('refresh-data').click()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md">
                        <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0114.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                        </svg>
                        Load Full Database
                    </button>
                </div>
            </div>
        `;
    }

    async loadData() {
        const refreshButton = document.getElementById('refresh-data');
        const gridElement = document.getElementById('npc-grid');
        
        refreshButton.disabled = true;
        refreshButton.innerHTML = `
            <svg class="w-4 h-4 inline mr-2 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0114.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            Loading...
        `;
        
        gridElement.innerHTML = `
            <div class="col-span-full flex justify-center py-16">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600 dark:text-github-muted">Loading full NPC database...</p>
                </div>
            </div>
        `;

        try {
            console.log('Attempting to fetch npc_database.json... - npc_viewer.js:139');
            
            // Try multiple possible paths
            const possiblePaths = [
                './npc_database.json',
                'npc_database.json',
                '../npc_database.json'
            ];
            
            let response = null;
            let lastError = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log(`Trying path: ${path} - npc_viewer.js:153`);
                    response = await fetch(path);
                    if (response.ok) {
                        console.log(`Success with path: ${path} - npc_viewer.js:156`);
                        break;
                    }
                } catch (error) {
                    console.log(`Failed with path ${path}: - npc_viewer.js:160`, error.message);
                    lastError = error;
                }
            }
            
            if (!response || !response.ok) {
                throw lastError || new Error('All paths failed - ensure npc_database.json is in the same directory');
            }
            
            const data = await response.json();
            console.log('Successfully parsed JSON data - npc_viewer.js:170');
            
            this.npcData = data;
            this.filteredData = Object.values(this.npcData);
            this.currentPage = 1; // Reset to first page
            this.updateStats();
            this.filterAndDisplay();
            
            console.log(`Loaded ${Object.keys(this.npcData).length} NPCs from database - npc_viewer.js:178`);
            this.updateDatabaseStatus(true);
            
            // Show success notification
            this.showSuccessNotification(Object.keys(this.npcData).length);
            
        } catch (error) {
            console.error('Failed to load database: - npc_viewer.js:185', error);
            
            gridElement.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-github-surface rounded-xl border border-red-200 dark:border-red-800">
                    <div class="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-github-text mb-2">Failed to Load Database</h3>
                    <div class="text-center max-w-md space-y-3">
                        <p class="text-red-600 dark:text-red-400">
                            Could not load <strong>npc_database.json</strong>
                        </p>
                        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                            <p class="text-sm text-red-800 dark:text-red-200 mb-2">
                                <strong>Troubleshooting:</strong>
                            </p>
                            <ul class="text-xs text-red-700 dark:text-red-300 text-left space-y-1">
                                <li>• Ensure <code>npc_database.json</code> is in the same folder as this HTML file</li>
                                <li>• Run from a web server (not file://) - try: <code>python -m http.server 8000</code></li>
                                <li>• Check browser console for detailed errors</li>
                                <li>• Verify the JSON file is valid and not corrupted</li>
                            </ul>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Error: ${error.message}
                        </p>
                        <button onclick="location.reload()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
                            Retry
                        </button>
                    </div>
                </div>
            `;
            this.updateDatabaseStatus(false);
            throw error;
        } finally {
            refreshButton.disabled = false;
            refreshButton.innerHTML = `
                <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0114.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
                Refresh Database
            `;
        }
    }

    showSuccessNotification(npcCount) {
        const notice = document.createElement('div');
        notice.className = 'fixed top-4 right-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 shadow-lg z-50';
        notice.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-sm text-green-800 dark:text-green-200">Successfully loaded ${npcCount} NPCs</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-green-600 hover:text-green-800">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(notice);
        
        // Auto-remove notice after 5 seconds
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 5000);
    }

    updateDatabaseStatus(isLoaded) {
        const statusElement = document.getElementById('database-status');
        if (statusElement) {
            if (isLoaded) {
                statusElement.textContent = 'Loaded';
                statusElement.className = 'text-sm font-medium text-green-600 dark:text-green-400';
            } else {
                statusElement.textContent = 'Not loaded';
                statusElement.className = 'text-sm font-medium text-red-600 dark:text-red-400';
            }
        }
    }

    setupModal() {
        const modal = document.getElementById('npc-modal');
        const closeBtn = document.querySelector('.close');

        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.add('hidden');
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }

    showNPCDetails(npc) {
        const modal = document.getElementById('npc-modal');
        const modalName = document.getElementById('modal-npc-name');
        const modalBody = document.getElementById('modal-body');

        modalName.textContent = `${npc.name || 'Unknown NPC'} (ID: ${npc.id})`;
        modalBody.innerHTML = this.createDetailedView(npc);
        modal.classList.remove('hidden');
    }

    createNPCCard(npc) {
        const animations = npc.animations || [];
        const spawnAreas = npc.spawnAreas || [];
        const combatLevel = npc.combatLevel || 0;
        const encounters = npc.timesEncountered || 0;
        
        // Determine combat level color and badge
        let combatBadge = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        if (combatLevel === 0) combatBadge = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
        else if (combatLevel <= 50) combatBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
        else if (combatLevel <= 100) combatBadge = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
        else combatBadge = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
        
        return `
            <div class="npc-card bg-white dark:bg-github-surface rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-github-border hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all duration-300 hover:scale-[1.02] group overflow-hidden" data-npc-id="${npc.id}">
                <!-- Card Header -->
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-github-bg dark:to-github-surface px-4 py-3 border-b border-gray-200 dark:border-github-border">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                ${String(npc.id).slice(-2).padStart(2, '0')}
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-900 dark:text-github-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 text-lg leading-tight">
                                    ${npc.name || 'Unknown NPC'}
                                </h3>
                                <p class="text-xs text-gray-500 dark:text-github-muted">ID: ${npc.id}</p>
                            </div>
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                        </div>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="p-4 space-y-4">
                    <!-- Combat Level Badge -->
                    <div class="flex justify-center">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${combatBadge}">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Combat Level: ${combatLevel || 'N/A'}
                        </span>
                    </div>

                    <!-- Stats Row -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                            <div class="flex items-center space-x-2 mb-1">
                                <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                </svg>
                                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Encounters</span>
                            </div>
                            <p class="text-lg font-bold text-blue-700 dark:text-blue-300">${encounters}</p>
                        </div>
                        
                        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                            <div class="flex items-center space-x-2 mb-1">
                                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                                </svg>
                                <span class="text-xs font-medium text-green-600 dark:text-green-400">Last Seen</span>
                            </div>
                            <p class="text-sm font-bold text-green-700 dark:text-green-300">${this.formatDate(npc.lastSeen)}</p>
                        </div>
                    </div>

                    <!-- Additional Info -->
                    <div class="space-y-2 pt-2 border-t border-gray-200 dark:border-github-border">
                        ${animations.length > 0 ? `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z"/>
                                    </svg>
                                    <span class="text-sm text-gray-600 dark:text-github-muted">Animations</span>
                                </div>
                                <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                                    ${animations.length}
                                </span>
                            </div>
                        ` : ''}
                        
                        ${spawnAreas.length > 0 ? `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                                    </svg>
                                    <span class="text-sm text-gray-600 dark:text-github-muted">Locations</span>
                                </div>
                                <span class="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium">
                                    ${spawnAreas.length}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Card Footer -->
                <div class="px-4 py-3 bg-gray-50 dark:bg-github-bg border-t border-gray-200 dark:border-github-border">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p class="text-xs text-center text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                            </svg>
                            Click for detailed view
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    createDetailedView(npc) {
        const animations = npc.animations || [];
        const spawnAreas = npc.spawnAreas || [];
        
        return `
            <div class="space-y-6">
                <!-- Basic Information Section -->
                <div class="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-github-text">Basic Information</h3>
                            <p class="text-sm text-gray-600 dark:text-github-muted">Core NPC details and statistics</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${this.createDetailInfoCard('NPC ID', npc.id, 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', 'text-blue-600 dark:text-blue-400')}
                        ${this.createDetailInfoCard('Name', npc.name || 'Unknown', 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700', 'text-gray-900 dark:text-github-text')}
                        ${this.createDetailInfoCard('Combat Level', npc.combatLevel || 'N/A', 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', this.getCombatLevelColor(npc.combatLevel))}
                        ${this.createDetailInfoCard('Max Health', npc.maxHealth || 'Unknown', 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', 'text-green-600 dark:text-green-400')}
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        ${this.createDetailInfoCard('Encounters', npc.timesEncountered || 0, 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', 'text-purple-600 dark:text-purple-400')}
                        ${this.createDetailInfoCard('First Seen', this.formatDate(npc.firstSeen), 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800', 'text-indigo-600 dark:text-indigo-400')}
                        ${this.createDetailInfoCard('Last Seen', this.formatDate(npc.lastSeen), 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', 'text-orange-600 dark:text-orange-400')}
                        ${this.createDetailInfoCard('Standing Anim', npc.standingAnimation !== -1 ? npc.standingAnimation : 'N/A', 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800', 'text-teal-600 dark:text-teal-400')}
                    </div>
                </div>

                ${animations.length > 0 ? `
                    <!-- Animations Section -->
                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                        <div class="flex items-center mb-6">
                            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 dark:text-github-text">Animation Data</h3>
                                <p class="text-sm text-gray-600 dark:text-github-muted">${animations.length} animation${animations.length !== 1 ? 's' : ''} recorded</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            ${animations.map(anim => `
                                <div class="relative group">
                                    <div class="bg-white dark:bg-github-surface rounded-xl p-4 text-center border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${anim === npc.standingAnimation ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 shadow-md' : 'border-purple-200 dark:border-purple-700 hover:border-purple-300'}">
                                        <div class="text-lg font-bold text-purple-600 dark:text-purple-400">${anim}</div>
                                        ${anim === npc.standingAnimation ? '<div class="text-xs text-purple-500 mt-1 font-medium">Standing</div>' : ''}
                                    </div>
                                    ${anim === npc.standingAnimation ? `
                                        <div class="absolute -top-2 -right-2">
                                            <div class="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                                                <svg class="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${spawnAreas.length > 0 ? `
                    <!-- Spawn Locations Section -->
                    <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                        <div class="flex items-center mb-6">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 dark:text-github-text">Spawn Locations</h3>
                                <p class="text-sm text-gray-600 dark:text-github-muted">${spawnAreas.length} coordinate${spawnAreas.length !== 1 ? 's' : ''} recorded</p>
                            </div>
                        </div>
                        
                        <div class="max-h-80 overflow-y-auto space-y-3">
                            ${spawnAreas.map((area, index) => `
                                <div class="bg-white dark:bg-github-surface rounded-xl p-4 border border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600 transition-colors duration-200">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                <span class="text-sm font-bold text-green-600 dark:text-green-400">${index + 1}</span>
                                            </div>
                                            <span class="font-mono text-sm text-gray-700 dark:text-github-text">${area}</span>
                                        </div>
                                        <div class="text-xs text-gray-500 dark:text-github-muted">
                                            Coordinate
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createDetailInfoCard(label, value, bgClass, textClass) {
        return `
            <div class="rounded-xl p-4 border ${bgClass}">
                <div class="text-xs font-medium text-gray-600 dark:text-github-muted mb-2 uppercase tracking-wide">${label}</div>
                <div class="text-xl font-bold ${textClass} break-words">${value}</div>
            </div>
        `;
    }

    getCombatLevelColor(combatLevel) {
        if (!combatLevel || combatLevel === 0) return 'text-green-600 dark:text-green-400';
        if (combatLevel <= 50) return 'text-blue-600 dark:text-blue-400';
        if (combatLevel <= 100) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.filterAndDisplay();
    }

    updateStats() {
        const totalNpcs = Object.keys(this.npcData).length;
        const filteredCount = this.filteredData.length;
        
        document.getElementById('total-npcs').textContent = totalNpcs;
        document.getElementById('filtered-npcs').textContent = filteredCount;
    }

    filterAndDisplay() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const sortBy = document.getElementById('sort-by').value;
        const combatFilter = document.getElementById('filter-combat').value;

        // Filter data
        this.filteredData = Object.values(this.npcData).filter(npc => {
            // Search filter
            const matchesSearch = !searchTerm || 
                (npc.name && npc.name.toLowerCase().includes(searchTerm)) ||
                npc.id.toString().includes(searchTerm);

            // Combat level filter
            const matchesCombat = this.matchesCombatFilter(npc, combatFilter);

            return matchesSearch && matchesCombat;
        });

        // Sort data
        this.sortData(sortBy);

        // Reset to first page when filtering
        this.currentPage = 1;

        // Display with pagination
        this.displayNPCs();
        this.updateStats();
    }

    matchesCombatFilter(npc, filter) {
        if (!filter) return true;
        
        const combat = npc.combatLevel || 0;
        
        switch (filter) {
            case '0': return combat === 0;
            case '1-50': return combat >= 1 && combat <= 50;
            case '51-100': return combat >= 51 && combat <= 100;
            case '100+': return combat > 100;
            default: return true;
        }
    }

    sortData(sortBy) {
        this.filteredData.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'encounters':
                    return (b.timesEncountered || 0) - (a.timesEncountered || 0);
                case 'lastSeen':
                    return (b.lastSeen || 0) - (a.lastSeen || 0);
                case 'id':
                default:
                    return a.id - b.id;
            }
        });
    }

    displayNPCs() {
        const gridElement = document.getElementById('npc-grid');
        
        if (this.filteredData.length === 0) {
            gridElement.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-github-surface rounded-xl border border-gray-200 dark:border-github-border">
                    <div class="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-github-text mb-2">No NPCs Found</h3>
                    <p class="text-gray-600 dark:text-github-muted text-center">No NPCs match your current search criteria.</p>
                </div>
            `;
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageData = this.filteredData.slice(startIndex, endIndex);
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);

        // Generate NPC cards
        const html = currentPageData.map(npc => this.createNPCCard(npc)).join('');
        
        // Add pagination controls
        const paginationHtml = this.createPaginationControls(totalPages);
        
        gridElement.innerHTML = html + paginationHtml;

        // Add click handlers to NPC cards
        const npcCards = gridElement.querySelectorAll('.npc-card');
        npcCards.forEach(card => {
            card.addEventListener('click', () => {
                const npcId = parseInt(card.dataset.npcId);
                const npc = this.filteredData.find(n => n.id === npcId);
                if (npc) {
                    this.showNPCDetails(npc);
                }
            });
        });

        // Add pagination click handlers
        this.bindPaginationEvents();

        // Update status
        this.updateDatabaseStatus(true);
    }

    createPaginationControls(totalPages) {
        if (totalPages <= 1) return '';

        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);

        return `
            <div class="col-span-full mt-8">
                <div class="bg-white dark:bg-github-surface rounded-xl border border-gray-200 dark:border-github-border p-6">
                    <div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                        <div class="text-sm text-gray-600 dark:text-github-muted">
                            Showing <span class="font-medium">${startItem}</span> to <span class="font-medium">${endItem}</span> of <span class="font-medium">${this.filteredData.length}</span> NPCs
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <button id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''} 
                                    class="px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-github-surface dark:text-github-text dark:border-github-border dark:hover:bg-gray-700'}">
                                Previous
                            </button>
                            
                            <div class="flex space-x-1">
                                ${this.generatePageNumbers(totalPages)}
                            </div>
                            
                            <button id="next-page" ${this.currentPage === totalPages ? 'disabled' : ''} 
                                    class="px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-github-surface dark:text-github-text dark:border-github-border dark:hover:bg-gray-700'}">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generatePageNumbers(totalPages) {
        let pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            let start = Math.max(1, this.currentPage - halfVisible);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);
            
            if (end - start < maxVisiblePages - 1) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages.map(page => `
            <button class="page-number px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${page === this.currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-github-surface dark:text-github-text dark:border-github-border dark:hover:bg-gray-700'}" 
                    data-page="${page}">
                ${page}
            </button>
        `).join('');
    }

    bindPaginationEvents() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageNumbers = document.querySelectorAll('.page-number');
        
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.displayNPCs();
                }
            });
        }
        
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.displayNPCs();
                }
            });
        }
        
        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.displayNPCs();
                }
            });
        });
    }
}

// Initialize the viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NPCViewer();
});
