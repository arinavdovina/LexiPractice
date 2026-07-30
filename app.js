(() => {
  'use strict';
  const formats = window.LEXICON_FORMATS || [];
  const categories = window.LEXICON_CATEGORIES || [];
  const PAGE_SIZE = 24;
  const STORAGE = {
    form: 'lexipractice.form.v1',
    history: 'lexipractice.history.v1',
    used: 'lexipractice.used.v1',
    selected: 'lexipractice.selected.v1'
  };

  const styles = [
    ['Методический минимализм','Чистая сетка, спокойные акценты, максимум места для выполнения.','#186a63'],
    ['Светлый академический','Строгая типографика, тонкие линии, нейтральная палитра.','#314f64'],
    ['Пастельная тетрадь','Мягкие поля, заметки, лёгкие рукописные акценты.','#8c6aa8'],
    ['Яркий начальный','Крупные блоки, понятные маркеры, дружелюбные формы.','#eb7b3d'],
    ['Иллюстрированный детский','Небольшие персонажи и визуальные опоры без перегруза.','#3d8c75'],
    ['Игровое поле','Клетки, уровни, жетоны и маршрут выполнения.','#b2682c'],
    ['Комикс-диалоги','Реплики, облака и динамичная последовательность.','#5b65b6'],
    ['Подростковый editorial','Журнальная сетка, смелые заголовки, современный ритм.','#202f55'],
    ['Anime light','Светлая динамичная композиция и аккуратные графические акценты.','#db6685'],
    ['Digital neon','Тёмный фон, интерфейсные карточки, неоновые детали.','#7657d6'],
    ['Dark academia','Тёмные зелёно-коричневые оттенки, классическая подача.','#3d4b3c'],
    ['Tech interface','Панели, индикаторы, системная типографика.','#216e8c'],
    ['Travel notebook','Стикеры, штампы, билеты и заметки путешественника.','#b65c42'],
    ['Detective dossier','Карточки улик, пометки, нумерация и логические связи.','#7a5637'],
    ['Science lab','Чёткие схемы, карточки наблюдений, лабораторная эстетика.','#2d7b87'],
    ['Eco natural','Спокойные природные оттенки, органичные формы.','#537d48'],
    ['Retro classroom','Винтажные учебные карточки и тёплая палитра.','#a6633f'],
    ['Monochrome print','Чёрно-белый дизайн с высокой контрастностью для печати.','#222222'],
    ['Limited two-color','Белый фон и два контрастных акцентных цвета.','#9b4141'],
    ['Flashcards clean','Модульные карточки с крупной лексикой и воздухом.','#34756f'],
    ['Exam practice','Экзаменационная логика, чёткая нумерация и тайминг.','#2e4a73'],
    ['Soft professional','Деликатная палитра для взрослых учеников и корпоративных занятий.','#6b6574'],
    ['Social media cards','Компактные вертикальные блоки, пригодные для экрана.','#b04f78'],
    ['Accessible high contrast','Крупный шрифт, ясная иерархия и усиленный контраст.','#005f73']
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    form: $('builderForm'), targetLanguage:$('targetLanguage'), instructionLanguage:$('instructionLanguage'), age:$('age'), level:$('level'), lessonMode:$('lessonMode'), duration:$('duration'),
    vocabulary:$('vocabulary'), vocabCount:$('vocabCount'), goal:$('goal'), itemCount:$('itemCount'), difficulties:$('difficulties'), context:$('context'), newLexis:$('newLexis'), answerKey:$('answerKey'),
    outputType:$('outputType'), style:$('style'), orientation:$('orientation'), colorMode:$('colorMode'), stylePreview:$('stylePreview'),
    search:$('searchInput'), category:$('categoryFilter'), difficulty:$('difficultyFilter'), excludeUsed:$('excludeUsed'), grid:$('formatGrid'), shownCount:$('shownCount'), pageInfo:$('pageInfo'), prev:$('prevPage'), next:$('nextPage'), chips:$('categoryChips'),
    selectedSummary:$('selectedSummary'), generate:$('generateBtn'), prompt:$('promptOutput'), validation:$('validationMessage'), copy:$('copyBtn'), download:$('downloadBtn'), clear:$('clearBtn'), random:$('randomBtn'),
    formatDialog:$('formatDialog'), dialogContent:$('dialogContent'), historyDialog:$('historyDialog'), historyList:$('historyList'), historyCount:$('historyCount'), toast:$('toast')
  };

  let state = {
    page: 1,
    selectedId: localStorage.getItem(STORAGE.selected) || null,
    used: new Set(JSON.parse(localStorage.getItem(STORAGE.used) || '[]')),
    history: JSON.parse(localStorage.getItem(STORAGE.history) || '[]')
  };

  function init(){
    populateStyles(); populateCategories(); restoreForm(); bindEvents(); updateVocabCount(); renderStylePreview(); renderCatalog(); renderSelected(); renderHistory();
  }

  function populateStyles(){
    styles.forEach(([name]) => els.style.add(new Option(name,name)));
  }
  function populateCategories(){
    categories.forEach(c => {
      els.category.add(new Option(`${c.icon} ${c.name}`,c.id));
      const b=document.createElement('button'); b.type='button'; b.className='chip'; b.dataset.category=c.id; b.textContent=`${c.icon} ${c.name}`; els.chips.appendChild(b);
    });
  }
  function bindEvents(){
    els.form.addEventListener('input', saveForm);
    els.vocabulary.addEventListener('input', updateVocabCount);
    els.style.addEventListener('change', renderStylePreview);
    [els.search,els.category,els.difficulty,els.excludeUsed,els.level].forEach(el => el.addEventListener('input',()=>{state.page=1;renderCatalog();}));
    els.prev.addEventListener('click',()=>{if(state.page>1){state.page--;renderCatalog();scrollCatalog();}});
    els.next.addEventListener('click',()=>{state.page++;renderCatalog();scrollCatalog();});
    els.random.addEventListener('click',selectRandom);
    els.generate.addEventListener('click',generatePrompt);
    els.copy.addEventListener('click',copyPrompt);
    els.download.addEventListener('click',downloadPrompt);
    els.clear.addEventListener('click',()=>{els.prompt.value=''; showToast('Поле очищено');});
    $('closeDialogBtn').addEventListener('click',()=>els.formatDialog.close());
    $('openHistoryBtn').addEventListener('click',()=>{renderHistory();els.historyDialog.showModal();});
    $('closeHistoryBtn').addEventListener('click',()=>els.historyDialog.close());
    $('clearHistoryBtn').addEventListener('click',clearHistory);
    $('exportSettingsBtn').addEventListener('click',exportSettings);
    $('importSettingsInput').addEventListener('change',importSettings);
    document.querySelectorAll('.step').forEach(b=>b.addEventListener('click',()=>$(b.dataset.scroll).scrollIntoView({behavior:'smooth',block:'start'})));
    els.chips.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;els.category.value=els.category.value===b.dataset.category?'all':b.dataset.category;state.page=1;renderCatalog();});
  }

  function getFormData(){
    const ids=['targetLanguage','instructionLanguage','age','level','lessonMode','duration','vocabulary','goal','itemCount','difficulties','context','newLexis','answerKey','outputType','style','orientation','colorMode'];
    return Object.fromEntries(ids.map(id=>[id,$(id).value]));
  }
  function saveForm(){ localStorage.setItem(STORAGE.form,JSON.stringify(getFormData())); }
  function restoreForm(){
    try{const data=JSON.parse(localStorage.getItem(STORAGE.form)||'{}');Object.entries(data).forEach(([id,v])=>{if($(id))$(id).value=v;});}catch(e){}
  }
  function parseVocabulary(raw=els.vocabulary.value){
    return raw.split(/\n|,|;/).map(s=>s.trim()).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
  }
  function updateVocabCount(){els.vocabCount.textContent=parseVocabulary().length;}
  function renderStylePreview(){
    const found=styles.find(s=>s[0]===els.style.value)||styles[0];
    els.stylePreview.style.setProperty('--preview-accent',found[2]);
    els.stylePreview.innerHTML=`<div class="style-preview-copy"><b>${escapeHtml(found[0])}</b><span>${escapeHtml(found[1])}</span></div><div class="style-preview-card" aria-hidden="true"></div>`;
  }
  function filteredFormats(){
    const q=els.search.value.trim().toLowerCase(); const cat=els.category.value; const diff=els.difficulty.value; const level=els.level.value;
    return formats.filter(f => {
      if(cat!=='all'&&f.categoryId!==cat)return false;
      if(diff!=='all'&&String(f.difficulty)!==diff)return false;
      if(level&&!f.levels.includes(level))return false;
      if(els.excludeUsed.checked&&state.used.has(f.id))return false;
      if(q&&!`${f.id} ${f.title} ${f.mechanic} ${f.category} ${f.variant}`.toLowerCase().includes(q))return false;
      return true;
    });
  }
  function renderCatalog(){
    const filtered=filteredFormats(); const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)); state.page=Math.min(state.page,pages);
    const start=(state.page-1)*PAGE_SIZE; const pageItems=filtered.slice(start,start+PAGE_SIZE);
    els.shownCount.textContent=filtered.length; els.pageInfo.textContent=`Страница ${state.page} из ${pages}`; els.prev.disabled=state.page<=1; els.next.disabled=state.page>=pages;
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.category===els.category.value));
    if(!pageItems.length){els.grid.innerHTML='<div class="empty-state"><b>Подходящих форматов не найдено</b>Измените фильтры или разрешите показ использованных форматов.</div>';return;}
    els.grid.innerHTML=pageItems.map(cardHtml).join('');
    els.grid.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>selectFormat(b.dataset.select)));
    els.grid.querySelectorAll('[data-details]').forEach(b=>b.addEventListener('click',()=>openDetails(b.dataset.details)));
  }
  function cardHtml(f){
    const selected=f.id===state.selectedId, used=state.used.has(f.id);
    return `<article class="format-card ${selected?'selected':''} ${used?'used':''}">
      <div class="format-code">${f.id} · ${escapeHtml(f.categoryIcon)} ${escapeHtml(f.category)}</div>
      <h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.mechanic)}</p>
      <div class="format-meta"><span class="tag">${difficultyLabel(f.difficulty)}</span><span class="tag">${escapeHtml(f.mode)}</span><span class="tag">${escapeHtml(f.stage)}</span></div>
      <div class="format-actions"><button class="mini-btn" data-select="${f.id}">${selected?'Выбран':'Выбрать'}</button><button class="mini-btn details" data-details="${f.id}">Подробнее</button></div>
    </article>`;
  }
  function selectFormat(id){state.selectedId=id;localStorage.setItem(STORAGE.selected,id);renderCatalog();renderSelected();showToast(`Выбран формат ${id}`);}
  function selectRandom(){
    const pool=filteredFormats(); if(!pool.length){showToast('Нет подходящих форматов');return;}
    const unused=pool.filter(f=>!state.used.has(f.id)); const source=unused.length?unused:pool; const pick=source[Math.floor(Math.random()*source.length)];
    selectFormat(pick.id); const filtered=filteredFormats(); const idx=filtered.findIndex(f=>f.id===pick.id); if(idx>=0)state.page=Math.floor(idx/PAGE_SIZE)+1; renderCatalog(); renderSelected();
    document.querySelector(`[data-select="${pick.id}"]`)?.closest('.format-card')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function renderSelected(){
    const f=formats.find(x=>x.id===state.selectedId);
    els.selectedSummary.textContent=f?`${f.id}: ${f.title}. ${f.category}.`:'Сначала выберите формат из каталога.';
  }
  function openDetails(id){
    const f=formats.find(x=>x.id===id); if(!f)return;
    els.dialogContent.innerHTML=`<div class="dialog-format-code">${f.id} · ${escapeHtml(f.category)}</div><h2>${escapeHtml(f.title)}</h2>
      <div class="detail-block"><b>Механика</b><p>${escapeHtml(f.mechanic)}</p></div>
      <div class="detail-block"><b>Вариант организации</b><p>${escapeHtml(f.variantInstruction)}</p></div>
      <div class="detail-block"><b>Методическая цель</b><p>${escapeHtml(f.methodologicalFocus)}</p></div>
      <div class="detail-block"><b>Рекомендуемый этап</b><p>${escapeHtml(f.stage)} · ${escapeHtml(f.mode)} · ${difficultyLabel(f.difficulty)}</p></div>
      <button class="btn primary" id="dialogSelectBtn" type="button">Выбрать этот формат</button>`;
    els.formatDialog.showModal(); $('dialogSelectBtn').addEventListener('click',()=>{selectFormat(id);els.formatDialog.close();});
  }

  function validate(){
    const missing=[]; if(!els.targetLanguage.value.trim())missing.push('изучаемый язык'); if(!parseVocabulary().length)missing.push('список лексики'); if(!state.selectedId)missing.push('формат задания');
    if(missing.length){els.validation.hidden=false;els.validation.textContent=`Заполните: ${missing.join(', ')}.`;return false;} els.validation.hidden=true;return true;
  }

  function buildAnswerDistributionRules(itemCount){
    const count=Number.parseInt(itemCount,10)||10;
    return `КОНТРОЛЬ НЕПРЕДСКАЗУЕМОСТИ И КАЧЕСТВА ОТВЕТОВ
Применяй только те правила, которые подходят выбранной механике. Эти требования обязательны и важнее удобства шаблона.
1. До составления ученической версии молча создай внутреннюю карту правильных ответов для всех ${count} пунктов. Не показывай эту карту ученику и не описывай процесс.
2. В заданиях с 3–4 вариантами ответа распредели правильные позиции максимально равномерно: количество ответов в каждой позиции должно отличаться не более чем на 1. В первом пункте правильный ответ не должен стоять первым.
3. Не допускай трёх одинаковых правильных позиций подряд и очевидных узоров вроде A–B–C–D, A–B–A–B или постоянного смещения на одну позицию. После составления перемешай варианты ещё раз, сохранив смысл.
4. Правильная позиция A/1 не должна встречаться чаще остальных. Нельзя сначала написать все правильные варианты, а затем механически добавить дистракторы после них.
5. В сопоставлении независимо перемешай обе колонки. Не сохраняй пары на одной строке и не создавай диагональ 1–A, 2–B, 3–C. При 6 и более парах допускается не более одного случайного совпадения пары на одной строке.
6. В True/False, верно/неверно и заданиях с двумя альтернативами сбалансируй оба ответа: разница в количестве не более 1, одинаковый ответ не повторяется более двух раз подряд.
7. В заданиях «найди лишнее», «найди ошибку», «выбери подходящее слово» и подобных меняй место правильного элемента: начало, середина и конец должны использоваться сопоставимо часто.
8. Дистракторы должны быть сопоставимы с правильным ответом по части речи, грамматической форме, длине и тематической близости, но однозначно отвергаться по контексту. Исключи шуточные, абсурдные и заметно более длинные подсказки.
9. Не делай правильный ответ единственным грамматически оформленным, самым подробным или дословно повторяющим формулировку вопроса.
10. Перед выдачей молча сверяй ученическую версию с ключом. Если позиции распределены неравномерно, образуют заметный рисунок или правильный вариант угадывается без знания лексики, перестрой варианты и повтори проверку.`;
  }
  function generatePrompt(){
    if(!validate())return;
    const d=getFormData(); const f=formats.find(x=>x.id===state.selectedId); const vocab=parseVocabulary();
    const styleInfo=styles.find(s=>s[0]===d.style)||styles[0];
    const prompt=`Ты — опытный методист по преподаванию иностранных языков, специалист по лексическому подходу, активному извлечению из памяти, когнитивной нагрузке и педагогическому дизайну.\n\nСОЗДАЙ ПОЛНОСТЬЮ ГОТОВОЕ К ИСПОЛЬЗОВАНИЮ ЗАДАНИЕ, А НЕ СПИСОК ИДЕЙ И НЕ МЕТОДИЧЕСКИЙ КОММЕНТАРИЙ.\n\nПРОФИЛЬ ОБУЧАЮЩЕГОСЯ\n— Изучаемый язык: ${d.targetLanguage}.\n— Возраст: ${d.age}.\n— Уровень: ${d.level}.\n— Формат занятия: ${d.lessonMode}.\n— Планируемое время: ${d.duration}.\n— Язык инструкций ученику: ${d.instructionLanguage}.\n${d.context?`— Контекст и интересы: ${d.context}.\n`:''}${d.difficulties?`— Особые трудности: ${d.difficulties}.\n`:''}\nИЗУЧЕННАЯ ЛЕКСИКА ДЛЯ ЗАКРЕПЛЕНИЯ\n${vocab.map((v,i)=>`${i+1}. ${v}`).join('\n')}\n\nЦЕЛЬ\n— Главная цель: ${d.goal}.\n— Использовать лексику активно и многократно, но без бессмысленного повторения.\n— ${d.newLexis}.\n\nВЫБРАННЫЙ ФОРМАТ\n— Код: ${f.id}.\n— Категория: ${f.category}.\n— Название: «${f.title}».\n— Механика: ${f.mechanic}\n— Организация: ${f.variantInstruction}\n— Методический фокус: ${f.methodologicalFocus}.\n— Этап работы: ${f.stage}.\n— Режим: ${f.mode}.\n\nПАРАМЕТРЫ РЕЗУЛЬТАТА\n— Вид материала: ${d.outputType}.\n— Количество пунктов: ${d.itemCount}.\n— Ориентация: ${d.orientation}.\n— Цветовой режим: ${d.colorMode}.\n— Стиль: ${d.style}. ${styleInfo[1]}\n— Ответы: ${d.answerKey}.\n\nМЕТОДИЧЕСКИЕ ТРЕБОВАНИЯ\n1. Используй прежде всего предоставленную лексику. Не подменяй её тематически похожими словами.\n2. Адаптируй длину инструкций, предложений, объём письма и уровень абстракции строго под возраст ${d.age} и уровень ${d.level}.\n3. Каждый пункт должен проверять значение, форму, сочетаемость или уместность употребления, а не общие знания по теме.\n4. Если нужны отвлекающие варианты, сделай их правдоподобными и обеспечь один однозначно лучший ответ. Соблюдай отдельный блок контроля распределения ответов ниже.\n5. Не используй редкую грамматику и незнакомую лексику, которые помешают проверить именно целевые слова. Служебная лексика допустима только как понятная рамка.\n6. Не повторяй один и тот же пример дословно. Распредели целевые единицы равномерно; трудные слова можно повторить 2–3 раза в разных микроконтекстах.\n7. Инструкция ученику должна быть короткой, конкретной и сразу готовой для размещения на материале. Добавь один образец только тогда, когда без него механика может быть непонятна.\n8. Не включай методические пояснения внутрь ученической версии. Не оставляй placeholders, черновые пометки и фразы «добавьте свои слова».\n9. Проверь естественность всех сочетаний и примеров на изучаемом языке. Избегай буквальных калек.\n10. Сохрани выбранную механику во всём задании. Не превращай результат в набор разных упражнений.\n\n${buildAnswerDistributionRules(d.itemCount)}\n\nСТРУКТУРА ОТВЕТА\n1. Заголовок материала.\n2. Короткая инструкция ученику на выбранном языке.\n3. Полностью готовое задание из ${d.itemCount} пунктов.\n4. Место или понятный формат для ответов.\n${d.answerKey==='Без ключей'?'5. Не добавляй ответы и ключи.':`5. ${d.answerKey}. Размести их после ученической версии и визуально отдели.`}\n\nПеред выдачей результата молча проверь: все ли пункты однозначны, соответствует ли язык уровню, действительно ли используется заданная лексика, соблюдена ли механика ${f.id}, а распределение правильных ответов прошло отдельный аудит по правилам выше.`;
    els.prompt.value=prompt;
    markUsed(f.id); addHistory(f,prompt,d); saveForm();
    els.prompt.scrollIntoView({behavior:'smooth',block:'center'}); showToast('Промпт собран и сохранён в истории');
  }
  function markUsed(id){state.used.add(id);localStorage.setItem(STORAGE.used,JSON.stringify([...state.used]));renderCatalog();}
  function addHistory(f,prompt,d){
    state.history.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),createdAt:new Date().toISOString(),formatId:f.id,formatTitle:f.title,language:d.targetLanguage,level:d.level,prompt});
    state.history=state.history.slice(0,50);localStorage.setItem(STORAGE.history,JSON.stringify(state.history));renderHistory();
  }
  function renderHistory(){
    els.historyCount.textContent=state.history.length;
    if(!state.history.length){els.historyList.innerHTML='<div class="empty-state"><b>История пока пустая</b>Собранные промпты появятся здесь.</div>';return;}
    els.historyList.innerHTML=state.history.map(h=>`<div class="history-item"><div><b>${escapeHtml(h.formatId)} · ${escapeHtml(h.formatTitle)}</b><p>${escapeHtml(h.language)} · ${escapeHtml(h.level)} · ${new Date(h.createdAt).toLocaleString('ru-RU')}</p></div><div class="history-actions"><button data-load-history="${h.id}">Открыть</button><button data-delete-history="${h.id}">×</button></div></div>`).join('');
    els.historyList.querySelectorAll('[data-load-history]').forEach(b=>b.addEventListener('click',()=>loadHistory(b.dataset.loadHistory)));
    els.historyList.querySelectorAll('[data-delete-history]').forEach(b=>b.addEventListener('click',()=>deleteHistory(b.dataset.deleteHistory)));
  }
  function loadHistory(id){const h=state.history.find(x=>x.id===id);if(!h)return;els.prompt.value=h.prompt;state.selectedId=h.formatId;localStorage.setItem(STORAGE.selected,state.selectedId);renderSelected();renderCatalog();els.historyDialog.close();$('resultSection').scrollIntoView({behavior:'smooth'});}
  function deleteHistory(id){state.history=state.history.filter(x=>x.id!==id);localStorage.setItem(STORAGE.history,JSON.stringify(state.history));renderHistory();}
  function clearHistory(){if(!state.history.length)return;state.history=[];localStorage.setItem(STORAGE.history,'[]');renderHistory();showToast('История очищена');}
  async function copyPrompt(){if(!els.prompt.value.trim()){showToast('Сначала соберите промпт');return;}try{await navigator.clipboard.writeText(els.prompt.value);showToast('Промпт скопирован');}catch{els.prompt.select();document.execCommand('copy');showToast('Промпт скопирован');}}
  function downloadPrompt(){if(!els.prompt.value.trim()){showToast('Сначала соберите промпт');return;}downloadBlob(els.prompt.value,`lexipractice-${state.selectedId||'prompt'}.txt`,'text/plain;charset=utf-8');}
  function exportSettings(){const payload={version:1,exportedAt:new Date().toISOString(),form:getFormData(),selectedId:state.selectedId,used:[...state.used]};downloadBlob(JSON.stringify(payload,null,2),'lexipractice-settings.json','application/json');}
  function importSettings(e){
    const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(reader.result);Object.entries(p.form||{}).forEach(([id,v])=>{if($(id))$(id).value=v;});state.selectedId=p.selectedId||state.selectedId;state.used=new Set(p.used||[]);localStorage.setItem(STORAGE.used,JSON.stringify([...state.used]));localStorage.setItem(STORAGE.selected,state.selectedId||'');saveForm();updateVocabCount();renderStylePreview();renderCatalog();renderSelected();showToast('Настройки импортированы');}catch{showToast('Не удалось прочитать файл');}};reader.readAsText(file);e.target.value='';
  }
  function downloadBlob(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
  function difficultyLabel(n){return ({1:'Базовая',2:'Средняя',3:'Повышенная',4:'Высокая'})[n]||'Средняя';}
  function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));}
  function showToast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>els.toast.classList.remove('show'),2200);}
  function scrollCatalog(){$('formatSection').scrollIntoView({behavior:'smooth',block:'start'});}
  init();
})();
