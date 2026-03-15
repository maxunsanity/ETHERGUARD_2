document.addEventListener('DOMContentLoaded', () => {

    // UI Elements
    const questTitle = document.getElementById('quest-title');
    const questIdEl = document.getElementById('quest-id');
    const questDesc = document.getElementById('quest-desc');
    const questCond = document.getElementById('quest-conditions');
    const questRew = document.getElementById('quest-rewards');
    const scenarioText = document.getElementById('scenario-text');

    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const chatContainer = document.getElementById('chat-container');
    const emotionTagBadge = document.getElementById('emotion-tag-badge');
    const stressValueEl = document.getElementById('stress-value');
    const npcNameEl = document.getElementById('npc-name');
    const npcAvatarEl = document.getElementById('npc-avatar');

    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnMenu = document.getElementById('btn-show-menu');

    // Selection UI
    const sectorOverlay = document.getElementById('sector-selection-overlay');
    const stageOverlay = document.getElementById('stage-selection-overlay');
    const gameMain = document.getElementById('game-main');
    const sectorList = document.getElementById('sector-list');
    const stageList = document.getElementById('stage-list');
    const sectorTitleEl = document.getElementById('selected-sector-title');
    const sectorDescEl = document.getElementById('selected-sector-desc');
    const btnBackToSectors = document.getElementById('btn-back-to-sectors');

    // Quest UI Extensions
    const questTypeBadge = document.getElementById('quest-type-badge');
    const questLevelBadge = document.getElementById('quest-level-badge');
    const btnTestSuccess = document.getElementById('btn-test-success');
    const btnTestFailure = document.getElementById('btn-test-failure');

    // Result Modal Elements
    const resultOverlay = document.getElementById('result-modal-overlay');
    const successModal = document.getElementById('quest-success-modal');
    const failureModal = document.getElementById('quest-failure-modal');
    const successRewardsList = document.getElementById('success-rewards-list');
    const btnSuccessContinue = document.getElementById('btn-success-continue');
    const btnFailureRetry = document.getElementById('btn-failure-retry');
    const btnFailureExit = document.getElementById('btn-failure-exit');

    // Tooltip Elements
    const sectorTooltip = document.getElementById('sector-tooltip');
    const tooltipBossName = document.getElementById('tooltip-boss-name');
    const tooltipBossImage = document.getElementById('tooltip-boss-image');
    const tooltipBgSetting = document.getElementById('tooltip-bg-setting');
    const tooltipSummary = document.getElementById('tooltip-summary');
    const tooltipUnlock = document.getElementById('tooltip-unlock');
    const tooltipBgm = document.getElementById('tooltip-bgm');
    const tooltipStatsTotal = document.getElementById('tooltip-stats-total');
    const tooltipStatsMain = document.getElementById('tooltip-stats-main');
    const tooltipStatsSub = document.getElementById('tooltip-stats-sub');
    const tooltipStatsEvent = document.getElementById('tooltip-stats-event');
    const tooltipStatsSecret = document.getElementById('tooltip-stats-secret');

    // Stage Tooltip Elements
    const stageTooltip = document.getElementById('stage-tooltip');
    const stageTooltipName = document.getElementById('stage-tooltip-name');
    const stageTooltipType = document.getElementById('stage-tooltip-type');
    const stageTooltipAttribute = document.getElementById('stage-tooltip-attribute');
    const stageTooltipScenario = document.getElementById('stage-tooltip-scenario');
    const stageTooltipCondition = document.getElementById('stage-tooltip-condition');
    const stageTooltipDifficulty = document.getElementById('stage-tooltip-difficulty');
    const stageTooltipCost = document.getElementById('stage-tooltip-cost');
    const stageTooltipUnlock = document.getElementById('stage-tooltip-unlock');
    const stageTooltipRewards = document.getElementById('stage-tooltip-rewards');
    const stageTooltipTargetImg = document.getElementById('stage-tooltip-target-image');

    let characters = [];
    let emotions = [];
    
    let currentIndex = 0;
    let currentConditions = [];
    let currentStress = 0;
    let currentCharacter = null;
    let globalTurnCount = 0; // 실시간 턴 수 집계

    // UI Element for Stress
    const mainStressBar = document.getElementById('main-stress-bar');

    // Initialize
    function init() {
        console.log("Initializing Etherguard Prototype...");
        
        const loadConfigs = [
            { id: 'quest', data: typeof csvData !== 'undefined' ? csvData : null, setter: d => quests = d },
            { id: 'stat', data: typeof statCsvData !== 'undefined' ? statCsvData : null, setter: d => stats = d },
            { id: 'sector', data: typeof sectorCsvData !== 'undefined' ? sectorCsvData : null, setter: d => sectors = d },
            { id: 'stage', data: typeof stageCsvData !== 'undefined' ? stageCsvData : null, setter: d => stages = d },
            { id: 'character', data: typeof characterCsvData !== 'undefined' ? characterCsvData : null, setter: d => characters = d },
            { id: 'emotion', data: typeof emotionCsvData !== 'undefined' ? emotionCsvData : null, setter: d => emotions = d }
        ];

        let pending = loadConfigs.length;

        loadConfigs.forEach(cfg => {
            if (!cfg.data) {
                console.warn(`Data source [${cfg.id}] is missing or undefined.`);
                finish(cfg.id);
                return;
            }

            Papa.parse(cfg.data, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    console.log(`Loaded [${cfg.id}]: ${results.data.length} records`);
                    cfg.setter(results.data);
                    finish(cfg.id);
                },
                error: function(err) {
                    console.error(`Error parsing [${cfg.id}]:`, err);
                    finish(cfg.id);
                }
            });
        });

        function finish(id) {
            pending--;
            if (pending === 0) {
                console.log("All data sources processed. Quests:", quests.length, "Sectors:", sectors.length);
                if (sectors.length > 0) {
                    showSectorSelection();
                } else if (quests.length > 0) {
                    // Fallback to direct quest load if no sectors
                    console.warn("No sectors found, falling back to direct quest load.");
                    sectorOverlay.classList.add('hidden');
                    gameMain.classList.remove('hidden');
                    loadQuest(0);
                } else {
                    showError("No data available to load.");
                }
            }
        }
    }

    function showSectorSelection() {
        sectorOverlay.classList.remove('hidden');
        stageOverlay.classList.add('hidden');
        gameMain.classList.add('hidden');

        sectorList.innerHTML = '';
        sectors.filter(s => s.sector_id).forEach(sector => {
            const card = document.createElement('div');
            card.className = "sector-card p-6 rounded-lg cursor-pointer flex flex-col gap-3 relative border border-cyber-border/20";
            
            // Apply background style if exists
            if (sector['섹터 배경 이미지']) {
                card.style.setProperty('--bg-image', `url(${sector['섹터 배경 이미지']}.jpg)`);
                // Note: Actual asset check is omitted, assuming .jpg naming convention for prototype
                card.style.position = 'relative';
                card.style.background = 'none'; // Overridden by pseudo-element in CSS
                
                // Add inline style to pseudo-element hack (since we can't edit pseudo-classes in JS directly easily)
                const bgOverlay = document.createElement('div');
                bgOverlay.className = "absolute inset-0 z-[-1] opacity-20 bg-cover bg-center transition-all duration-300 pointer-events-none";
                bgOverlay.style.backgroundImage = `url(assets/${sector['섹터 배경 이미지']}.jpg)`; // Added assets/ prefix for prototype structure
                card.appendChild(bgOverlay);
            }

            card.innerHTML += `
                <div class="flex justify-between items-start">
                    <div class="text-[10px] font-mono text-cyber-neonBlue tracking-widest uppercase">Sector ${sector.sector_id}</div>
                    <div class="text-[9px] font-mono text-gray-600">${sector['섹터 영문명'] || ''}</div>
                </div>
                <div class="text-xl font-bold text-white">${sector.섹터명}</div>
                <div class="text-xs text-gray-400 line-clamp-2">${sector['섹터 스토리 요약']}</div>
                <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                    <span class="text-[10px] font-mono text-gray-500">${sector['지배 세력']}</span>
                    <span class="text-cyber-neonPink text-xs font-bold">ACCESS AREA &gt;</span>
                </div>
            `;

            // Tooltip interactions
            card.onmouseenter = (e) => {
                updateSectorTooltip(sector);
                const rect = card.getBoundingClientRect();
                sectorTooltip.style.top = `${rect.top}px`;
                sectorTooltip.style.left = `${rect.right + 20}px`;
                sectorTooltip.classList.remove('opacity-0');
            };

            card.onmouseleave = () => {
                sectorTooltip.classList.add('opacity-0');
            };

            card.onclick = () => {
                sectorTooltip.classList.add('opacity-0');
                showStageSelection(sector);
            };
            
            sectorList.appendChild(card);
        });
    }

    function updateSectorTooltip(sector) {
        if (!sectorTooltip) return;
        
        tooltipBossName.textContent = sector.보스 || 'UNKNOWN';
        tooltipSummary.textContent = sector['섹터 스토리 요약'] || '';
        tooltipBgSetting.textContent = sector['배경 설정'] || 'No additional data available.';
        tooltipUnlock.textContent = sector['언락 조건'] || 'FREE ACCESS';
        tooltipBgm.textContent = sector['섹터 BGM'] || 'SYSTEM_DEFAULT';
        
        tooltipStatsTotal.textContent = `TOTAL: ${sector['총 스테이지 수'] || '0'}`;
        tooltipStatsMain.textContent = `M: ${sector['메인 수'] || '0'}`;
        tooltipStatsSub.textContent = `S: ${sector['서브 수'] || '0'}`;
        tooltipStatsEvent.textContent = `E: ${sector['이벤트 수'] || '0'}`;
        tooltipStatsSecret.textContent = `X: ${sector['비밀 수'] || '0'}`;
        
        // Placeholder boss representation (Square box face as requested)
        tooltipBossImage.innerHTML = `
            <div class="placeholder-avatar w-full h-full flex flex-col items-center justify-center bg-cyber-neonPink/5 border border-cyber-neonPink/20">
                <span class="text-[9px] font-mono text-cyber-neonPink/60 uppercase">${sector.보스 ? sector.보스.substring(0, 4) : 'AI'}</span>
            </div>
        `;
    }

    function showStageSelection(sector) {
        sectorOverlay.classList.add('hidden');
        stageOverlay.classList.remove('hidden');
        gameMain.classList.add('hidden');

        sectorTitleEl.textContent = sector.섹터명;
        sectorDescEl.textContent = `>> OPERATIONAL STATUS: ${sector['지배 세력']} ZONE | ${sector['배경 설정']}`;

        const sectorStages = stages.filter(s => String(s['섹터 id']).trim() === String(sector.sector_id).trim());
        
        stageList.innerHTML = '';
        sectorStages.forEach((stage, index) => {
            const card = document.createElement('div');
            const type = stage['스테이지 타입'] || '일반';
            const isBoss = type.includes('보스') || type.includes('메인');
            
            card.className = `stage-card p-4 rounded bg-white/5 border border-white/10 cursor-pointer transition-all ${isBoss ? 'border-cyber-neonPink/50 bg-cyber-neonPink/5' : ''}`;
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-mono text-gray-500 uppercase">Stage ${index + 1}</span>
                    <span class="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono ${isBoss ? 'text-cyber-neonPink' : 'text-cyber-neonBlue'}">${type}</span>
                </div>
                <div>
                    <div class="text-sm font-bold text-white mb-1">${stage['스테이지 이름']}</div>
                    <div class="text-[10px] text-gray-400">${stage['클리어 조건'] || ''}</div>
                </div>
            `;

            // Tooltip interactions
            card.onmouseenter = (e) => {
                updateStageTooltip(stage);
                const rect = card.getBoundingClientRect();
                
                // Position logic (try to show on left if no space on right)
                let left = rect.right + 20;
                if (left + 450 > window.innerWidth) {
                    left = rect.left - 470;
                }
                
                stageTooltip.style.top = `${Math.max(100, rect.top - 50)}px`;
                stageTooltip.style.left = `${left}px`;
                stageTooltip.classList.remove('opacity-0');
            };

            card.onmouseleave = () => {
                stageTooltip.classList.add('opacity-0');
            };

            card.onclick = () => {
                stageTooltip.classList.add('opacity-0');
                enterStage(stage);
            };
            
            stageList.appendChild(card);
        });
    }

    function updateStageTooltip(stage) {
        if (!stageTooltip) return;
        
        stageTooltipName.textContent = stage['스테이지 이름'] || 'UNKNOWN';
        stageTooltipType.textContent = stage['스테이지 타입'] || 'NORMAL';
        stageTooltipAttribute.textContent = `Attribute: ${stage['스테이지 속성'] || 'Standard'}`;
        stageTooltipScenario.textContent = stage['스테이지 시나리오'] || 'No additional mission logs found.';
        stageTooltipCondition.textContent = stage['클리어 조건'] || 'NONE';
        
        // Difficulty visualization
        const diffLevel = parseInt(stage['난이도']) || 1;
        stageTooltipDifficulty.textContent = '★ '.repeat(diffLevel) + '☆ '.repeat(Math.max(0, 5 - diffLevel));
        
        stageTooltipCost.textContent = `Energy: ${stage['채팅 에너지 소모량'] || '0'}`;
        stageTooltipUnlock.textContent = stage['해금 조건'] || 'UNLOCKED';
        
        // Rewards
        stageTooltipRewards.innerHTML = '';
        const rawRewards = stage['클리어 보상'] || '';
        if (rawRewards) {
            rawRewards.split('/').forEach(r => {
                const badge = document.createElement('span');
                badge.className = "px-2 py-1 bg-cyber-neonYellow/10 text-cyber-neonYellow border border-cyber-neonYellow/30 rounded";
                badge.textContent = r.trim();
                stageTooltipRewards.appendChild(badge);
            });
        }
        
        // Placeholder target representation (Square box face)
        stageTooltipTargetImg.innerHTML = `
            <div class="placeholder-avatar w-full h-full flex flex-col items-center justify-center bg-cyber-neonBlue/5 border border-cyber-neonBlue/20">
                <span class="text-[9px] font-mono text-cyber-neonBlue/60 uppercase">${stage['타겟 대표 이미지'] ? 'TARGET' : 'AI'}</span>
            </div>
        `;
    }

    function enterStage(stage) {
        const questId = stage['퀘스트 번호'];
        const qIndex = quests.findIndex(q => {
            const id = q['quest_id'] || q['\uFEFFquest_id'];
            return String(id).trim() === String(questId).trim();
        });

        if (qIndex >= 0) {
            stageOverlay.classList.add('hidden');
            gameMain.classList.remove('hidden');
            loadQuest(qIndex);
        } else {
            alert("Quest data not found for stage: " + stage['스테이지 이름']);
        }
    }

    btnBackToSectors.onclick = showSectorSelection;
    btnMenu.onclick = () => {
        // Return to the stages of current sector
        const currentQuest = quests[currentIndex];
        const stageId = currentQuest['스테이지'];
        const stage = stages.find(s => String(s['퀘스트 번호']).trim() === String(currentQuest['quest_id']).trim());
        if (stage) {
            const sector = sectors.find(sec => sec.sector_id === stage['섹터 id']);
            if (sector) showStageSelection(sector);
            else showSectorSelection();
        } else {
            showSectorSelection();
        }
    };

    function showError(msg) {
        questTitle.textContent = "ERROR";
        questDesc.textContent = msg;
        questDesc.classList.add("text-cyber-neonPink");
    }

    function loadQuest(index) {
        if (index < 0) index = 0;
        if (index >= quests.length) index = quests.length - 1;

        currentIndex = index;
        const q = quests[index];

        const id = q['quest_id'] || q['\uFEFFquest_id'] || q[' quest_id'] || '???';
        const title = q['퀘스트 이름'] || 'Unknown Quest';
        const desc = q['퀘스트 설명'] || 'No description available.';
        const scenario = q['시나리오'] || '';
        const firstLine = q['첫대사'] || '';
        
        // Extended Data
        const qType = q['퀘스트 타입'] || 'NORMAL';
        const qLevel = q['퀘스트 레벨'] || '0';

        // Character Name Logic
        const charId = q['기본스텟'] || q['\uFEFF기본스텟'] || q['기본스텟 '] || q['기본감정'];
        currentCharacter = characters.find(c => String(c['index']).trim() === String(charId).trim());
        const charName = currentCharacter ? currentCharacter['캐릭터명'] : "Unknown NPC";

        // Update UI
        questIdEl.textContent = id;
        questTitle.textContent = title;
        questDesc.textContent = desc;
        scenarioText.textContent = scenario;

        // Update Badges
        if (questTypeBadge) {
            questTypeBadge.textContent = qType;
            questTypeBadge.className = `px-2 py-0.5 text-[10px] font-mono border rounded uppercase ${qType.includes('보스') ? 'bg-cyber-neonPink/10 text-cyber-neonPink border-cyber-neonPink/30' : 'bg-cyber-neonBlue/10 text-cyber-neonBlue border-cyber-neonBlue/30'}`;
        }
        if (questLevelBadge) questLevelBadge.textContent = `LV.${qLevel}`;

        // Update NPC Header
        npcNameEl.textContent = charName; 
        npcAvatarEl.textContent = charName.substring(0, 1).toUpperCase();

        // Populate Emotion Tag Badge
        const emotionTag = q['감정태그'] || '';
        const emotionTagTitle = q['감정태그 표시명'] || '';
        if (emotionTagTitle) {
            emotionTagBadge.textContent = emotionTagTitle;
            emotionTagBadge.classList.remove('hidden');
        } else if (emotionTag) {
            emotionTagBadge.textContent = emotionTag;
            emotionTagBadge.classList.remove('hidden');
        } else {
            emotionTagBadge.classList.add('hidden');
        }

        // Populate Conditions
        currentConditions = [];
        const c1Type = q['조건 1'] || '';
        const c1Val = q['조건 1 값'] || '';
        const c2Type = q['조건 2'] || '';
        const c2Val = q['조건 2값'] || '';
        if (c1Type) currentConditions.push({ type: c1Type, val: c1Val, current: 0 });
        if (c2Type) currentConditions.push({ type: c2Type, val: c2Val, current: 0 });
        updateConditionsProgress();

        // Populate Rewards
        questRew.innerHTML = '';
        const r1Type = q['보상1 타입'] || '';
        const r1Val = q['보상1 수량'] || '';
        const r2Type = q['보상2 타입'] || '';
        const r2Val = q['보상2 수량'] || '';
        if (r1Type) addRewardBadge(`${r1Type} x${r1Val}`);
        if (r2Type) addRewardBadge(`${r2Type} x${r2Val}`);
        if (!r1Type && !r2Type) addRewardBadge("None");

        // Clear Chat and add system + first dialogue
        chatContainer.innerHTML = '';
        addChatMessage("System", `Initiating protocol sequence [${id}]: ${title}`, 'system');

        if (firstLine) {
            setTimeout(() => {
                addChatMessage(charName, firstLine.replace(/^"|"$|""/g, '').trim(), 'npc');
            }, 500);
        }

        // Update Nav buttons
        btnPrev.disabled = currentIndex === 0;
        btnPrev.style.opacity = currentIndex === 0 ? "0.3" : "1";
        btnNext.disabled = currentIndex === quests.length - 1;
        btnNext.style.opacity = currentIndex === quests.length - 1 ? "0.3" : "1";

        // Reset Stress Level
        let initialStress = 0;
        if (charId && stats.length > 0) {
            const charStat = stats.find(s => {
                const sId = s['index'] || s['\uFEFFindex'] || s[' index'];
                return String(sId).trim() === String(charId).trim();
            });
            if (charStat) {
                const stressVal = charStat['스트레스'] || charStat[' 스트레스'] || charStat['스트레스 '] || '0';
                initialStress = parseInt(stressVal, 10);
            }
        }
        currentStress = isNaN(initialStress) ? 0 : initialStress;
        updateStressUI();

        // Reset Turn Count
        globalTurnCount = 0;
    }

    function updateConditionsProgress() {
        questCond.innerHTML = '';
        if (currentConditions.length === 0) {
            questCond.innerHTML = '<li class="text-gray-500 text-xs text-center border-t border-white/5 py-4">No active conditions.</li>';
        } else {
            currentConditions.forEach(c => renderCondition(c));
        }
    }

    function renderCondition(c) {
        const li = document.createElement('li');
        li.className = "flex flex-col gap-1 mb-2 last:mb-0";

        let isGauge = false;
        let target = 0;
        let label = c.type;

        if (c.type.startsWith('게이지_')) {
            isGauge = true;
            target = parseInt(c.val, 10);
            if (isNaN(target)) target = 100;
            label = c.type.replace('게이지_', '');
        } else if (c.val && c.val.includes('이상')) {
            isGauge = true;
            target = parseInt(c.val, 10);
            if (isNaN(target)) target = 100;
        }

        if (isGauge) {
            const percent = Math.min((c.current / target) * 100, 100) + '%';
            const isComplete = c.current >= target;
            li.innerHTML = `
                <div class="flex justify-between items-end">
                    <span class="text-xs ${isComplete ? 'text-green-400' : 'text-cyber-neonBlue'} font-bold">${label}</span>
                    <span class="text-[10px] text-gray-400 font-mono">${c.current} / ${target}</span>
                </div>
                <div class="w-full h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                    <div class="h-full ${isComplete ? 'bg-green-400' : 'bg-cyber-neonBlue'} transition-all duration-300" style="width: ${percent};"></div>
                </div>
            `;
        } else {
            li.innerHTML = `
                <div class="flex items-start gap-2">
                    <div class="w-1.5 h-1.5 mt-1 bg-cyber-neonPink rounded-full shadow-[0_0_5px_rgba(255,0,60,0.8)]"></div>
                    <div>
                        <div class="text-xs text-cyber-neonPink font-bold">${c.type}</div>
                        <div class="text-[10px] text-gray-400 break-words">${c.val}</div>
                    </div>
                </div>
            `;
        }
        questCond.appendChild(li);
    }

    function addRewardBadge(text) {
        const div = document.createElement('div');
        div.className = "px-2 py-1 bg-cyber-neonYellow/10 text-cyber-neonYellow rounded text-xs border border-cyber-neonYellow/30 shadow-[0_0_5px_rgba(252,238,10,0.2)]";
        div.textContent = text;
        questRew.appendChild(div);
    }

    function addChatMessage(sender, text, type) {
        const wrap = document.createElement('div');
        wrap.className = `flex gap-3 w-full message-appear ${type === 'user' ? 'flex-row-reverse' : ''}`;

        let avatarHTML = '';
        let bubbleClasses = '';
        let senderName = sender;

        if (type === 'system') {
            bubbleClasses = 'bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono w-full text-center py-2 rounded uppercase tracking-widest';
            wrap.innerHTML = `<div class="${bubbleClasses}">${text}</div>`;
            chatContainer.appendChild(wrap);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return;
        } else if (type === 'user') {
            avatarHTML = `<div class="w-8 h-8 rounded shrink-0 bg-cyber-neonBlue text-black flex items-center justify-center font-bold text-[10px] shadow-[0_0_10px_rgba(0,243,255,0.5)] uppercase">USR</div>`;
            bubbleClasses = 'bg-cyber-neonBlue/10 border border-cyber-neonBlue/30 text-gray-200 rounded-lg rounded-tr-none px-4 py-3 text-sm';
            senderName = "YOU";
        } else {
            // npc
            const initials = sender ? sender.substring(0, 2) : "AI";
            avatarHTML = `<div class="w-8 h-8 rounded shrink-0 bg-gradient-to-br from-cyber-neonPink to-purple-600 text-white flex items-center justify-center font-bold text-[10px] ring-1 ring-white/20 shadow-[0_0_10px_rgba(255,0,60,0.5)] uppercase mt-5">${initials}</div>`;
            bubbleClasses = 'bg-white/5 border border-white/10 text-gray-200 rounded-lg rounded-tl-none px-4 py-3 text-sm';
        }

        wrap.innerHTML = `
            ${avatarHTML}
            <div class="flex flex-col gap-1 max-w-[80%] ${type === 'user' ? 'items-end' : 'items-start'}">
                <span class="text-[10px] text-gray-500 font-mono tracking-widest ml-1">${senderName ? senderName.toUpperCase() : "UNKNOWN"}</span>
                <div class="${bubbleClasses}">
                    ${text}
                </div>
            </div>
        `;

        chatContainer.appendChild(wrap);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Interactions
    btnNext.addEventListener('click', () => {
        if (currentIndex < quests.length - 1) {
            loadQuest(currentIndex + 1);
        } else {
            // If it's the last quest in the list (could be boss), return to menu
            btnMenu.click();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) loadQuest(currentIndex - 1);
    });

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Simulate progress conditionally
        currentConditions.forEach(c => {
            let isGauge = c.type.startsWith('게이지_') || (c.val && c.val.includes('이상'));
            if (isGauge) {
                let target = parseInt(c.val, 10) || 100;
                if (target > 10000) target = 100; 

                if (c.type.includes('글자수') || c.type.includes('글수')) {
                    c.current += text.length;
                } else {
                    c.current += Math.floor(Math.random() * 20) + 10;
                }
                if (c.current > target) c.current = target;
            }
        });
        updateConditionsProgress();

        // Simulate stress increase
        currentStress += Math.floor(Math.random() * 15) + 5;
        if (currentStress > 100) currentStress = 100;
        updateStressUI();

        // Add user msg
        addChatMessage("User", text, 'user');
        chatInput.value = '';

        // Increment Turn count
        globalTurnCount++;

        // Check for completion (Mock)
        const isAllComplete = currentConditions.every(c => {
             let isGauge = c.type.startsWith('게이지_') || (c.val && c.val.includes('이상'));
             if (isGauge) {
                 let target = parseInt(c.val, 10) || 100;
                 return c.current >= target;
             }
             return false;
        });

        const charName = currentCharacter ? currentCharacter['캐릭터명'] : "Unknown NPC";

        // Dummy NPC response
        setTimeout(() => {
            if (isAllComplete) {
                addChatMessage("System", "QUEST CONDITION CLEARED", 'system');
                addChatMessage(charName, "알겠습니다. 다음 단계로 넘어가죠. (이 대화는 가이드라인을 충족했습니다.)", 'npc');
            } else {
                addChatMessage(charName, "조금만 더... 당신의 말을 들어보고 싶어요.", 'npc');
            }
        }, 800);
    }

    btnSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    function updateStressUI() {
        if (!mainStressBar) return;
        mainStressBar.style.width = currentStress + '%';
        if (stressValueEl) stressValueEl.textContent = currentStress + '%';

        if (currentStress > 80) {
            mainStressBar.className = "h-full bg-red-600 transition-all duration-500 shadow-[0_0_15px_rgba(255,0,0,1)] animate-pulse";
        } else if (currentStress > 50) {
            mainStressBar.className = "h-full bg-cyber-neonPink transition-all duration-500 shadow-[0_0_10px_rgba(255,0,60,1)]";
        } else {
            mainStressBar.className = "h-full bg-cyber-neonBlue transition-all duration-500 shadow-[0_0_10px_rgba(0,243,255,1)]";
        }
    }

    // Modal Logic
    function showResultModal(isSuccess) {
        if (!resultOverlay) return;

        resultOverlay.classList.remove('hidden');
        void resultOverlay.offsetWidth;
        resultOverlay.classList.add('active', 'opacity-100');

        const q = quests[currentIndex];
        const charName = currentCharacter ? currentCharacter['캐릭터명'] : "Unknown NPC";

        if (isSuccess) {
            successModal.classList.remove('hidden');
            void successModal.offsetWidth;
            successModal.classList.add('active');
            failureModal.classList.add('hidden');
            failureModal.classList.remove('active');

            // 2. 캐릭터 대사 및 이미지 설정
            const successDescEl = document.getElementById('success-character-dialogue');
            const successCharNameEl = document.getElementById('success-character-name');
            if (successCharNameEl) successCharNameEl.textContent = charName;
            if (successDescEl) successDescEl.textContent = `"${q['퀘스트 이름']} 클리어! 당신의 동기화 능력은 정말 놀랍군요. 앞으로도 잘 부탁해요."`;

            // 3. 결과 정보 (턴수 + 조건)
            const successTurnsEl = document.getElementById('success-total-turns');
            if (successTurnsEl) successTurnsEl.textContent = `${globalTurnCount} Turns`;
            
            const successCondResultsEl = document.getElementById('success-conditions-results');
            if (successCondResultsEl) {
                successCondResultsEl.innerHTML = '';
                currentConditions.forEach(c => {
                    const row = document.createElement('div');
                    row.className = 'flex justify-between items-center bg-white/5 p-2 rounded';
                    row.innerHTML = `<span class="text-[10px] text-gray-400">${c.type}</span><span class="text-[10px] text-green-400 font-bold">COMPLETED</span>`;
                    successCondResultsEl.appendChild(row);
                });
            }

            // 5. 보상 목록
            successRewardsList.innerHTML = '';
            const rewards = [];
            if (q['보상1 타입']) rewards.push({ type: q['보상1 타입'], val: q['보상1 수량'] });
            if (q['보상2 타입']) rewards.push({ type: q['보상2 타입'], val: q['보상2 수량'] });
            
            if (rewards.length === 0) {
                const item = document.createElement('div');
                item.className = 'reward-item';
                item.innerHTML = `<span class="text-xs text-gray-500 font-mono italic">No standard rewards recovered</span>`;
                successRewardsList.appendChild(item);
            } else {
                rewards.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'reward-item';
                    item.innerHTML = `
                        <span class="text-xs text-gray-300 font-mono">${r.type}</span>
                        <span class="text-xs text-cyber-neonYellow font-bold">x${r.val}</span>
                    `;
                    successRewardsList.appendChild(item);
                });
            }

            // 6. 해금 알림 (목 데이터)
            const unlockNotice = document.getElementById('success-unlock-notice');
            const unlockedNameEl = document.getElementById('unlocked-stage-name');
            if (q['퀘스트 타입'] === '메인') {
                unlockNotice.classList.remove('hidden');
                unlockedNameEl.textContent = `NEXT MISSION: [${q['연계 퀘스트 ID'] || 'ST-999'}] ACCESS GRANTED`;
            } else {
                unlockNotice.classList.add('hidden');
            }

        } else {
            failureModal.classList.remove('hidden');
            void failureModal.offsetWidth;
            failureModal.classList.add('active');
            successModal.classList.add('hidden');
            successModal.classList.remove('active');

            // 1. 퀘스트 정보
            const failQuestName = document.getElementById('failure-quest-name');
            if (failQuestName) failQuestName.textContent = q['퀘스트 이름'];

            // 3. 상세 보기 탭 리셋
            const failDetailsPanel = document.getElementById('failure-details-panel');
            const detailsIcon = document.getElementById('details-toggle-icon');
            if (failDetailsPanel) failDetailsPanel.classList.add('hidden', 'active'); // 일단 닫힘 상태
            if (detailsIcon) detailsIcon.classList.remove('active');

            // 5 & 6. 게이지 업데이트
            const failStressVal = document.getElementById('failure-stress-value');
            const failStressGauge = document.getElementById('failure-stress-gauge');
            if (failStressVal) failStressVal.textContent = `${currentStress}%`;
            if (failStressGauge) failStressGauge.style.width = `${currentStress}%`;

            const failTurnsVal = document.getElementById('failure-turns-value');
            const failTurnsGauge = document.getElementById('failure-turns-gauge');
            const maxTurns = 20; // 가상 최대 턴
            if (failTurnsVal) failTurnsVal.textContent = `${globalTurnCount}/${maxTurns}`;
            if (failTurnsGauge) failTurnsGauge.style.width = `${Math.min((globalTurnCount / maxTurns) * 100, 100)}%`;

            // 7. 힌트 (emotion_tb 활용)
            const failTip = document.getElementById('failure-tip');
            if (failTip) {
                const questEmotion = q['감정태그'] ? q['감정태그'].split('/')[0] : '';
                const emotionData = emotions.find(e => e['태그명'].includes(questEmotion));
                if (emotionData && emotionData['가이드 힌트']) {
                    failTip.textContent = `"${emotionData['가이드 힌트']}"`;
                } else {
                    failTip.textContent = `"상대방의 감정 변화를 더 세밀하게 관찰해 보세요. 특정 키워드에 반응할 수도 있습니다."`;
                }
            }
        }
    }

    // 상세보기 토글 이벤트 등록
    const btnToggleDetails = document.getElementById('btn-toggle-failure-details');
    if (btnToggleDetails) {
        btnToggleDetails.addEventListener('click', () => {
            const panel = document.getElementById('failure-details-panel');
            const icon = document.getElementById('details-toggle-icon');
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                // Use setTimeout to ensure display: block is applied before adding opacity/max-height for animation
                setTimeout(() => panel.classList.add('active'), 10);
                icon.classList.add('active');
            } else {
                panel.classList.remove('active');
                setTimeout(() => panel.classList.add('hidden'), 300);
                icon.classList.remove('active');
            }
        });
    }

    function closeModals() {
        resultOverlay.classList.remove('active', 'opacity-100');
        successModal.classList.remove('active');
        failureModal.classList.remove('active');
        setTimeout(() => {
            resultOverlay.classList.add('hidden');
            successModal.classList.add('hidden');
            failureModal.classList.add('hidden');
        }, 500);
    }

    // Modal Events
    btnTestSuccess.addEventListener('click', () => showResultModal(true));
    btnTestFailure.addEventListener('click', () => showResultModal(false));

    btnSuccessContinue.addEventListener('click', () => {
        closeModals();
        // Go to next quest or return to lobby
        if (currentIndex < quests.length - 1) {
            loadQuest(currentIndex + 1);
        } else {
            btnMenu.click();
        }
    });

    btnFailureRetry.addEventListener('click', () => {
        closeModals();
        loadQuest(currentIndex); // Restart current quest
    });

    btnFailureExit.addEventListener('click', () => {
        closeModals();
        btnMenu.click(); // Back to stage selection
    });

    const btnSuccessLobby = document.getElementById('btn-success-lobby');
    if (btnSuccessLobby) {
        btnSuccessLobby.addEventListener('click', () => {
            closeModals();
            btnMenu.click();
        });
    }

    // Start
    init();
});
