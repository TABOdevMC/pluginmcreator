(function () {
  'use strict';

  var workspace = null;
  var state = {
    commands: [],
    permissions: [],
    configs: [],
    data: [],
    modules: {},
    customCode: '',
    locked: false
  };

  function byId(id) { return document.getElementById(id); }

  function setText(id, text) {
    var el = byId(id);
    if (el) el.textContent = text;
  }

  function showPage(id) {
    var pages = document.querySelectorAll('.page');
    var links = document.querySelectorAll('[data-page]');
    var i;
    for (i = 0; i < pages.length; i++) {
      pages[i].classList.toggle('active', pages[i].id === 'page-' + id);
    }
    for (i = 0; i < links.length; i++) {
      links[i].classList.toggle('active', links[i].getAttribute('data-page') === id);
    }
    var title = byId('pageTitle');
    if (title) title.textContent = id.charAt(0).toUpperCase() + id.slice(1);
    if (id === 'procedures') resizeBlockly();
  }

  window.openPage = showPage;

  function notify(message, error) {
    var box = byId('appStatus');
    if (!box) return;
    box.textContent = message;
    box.className = error ? 'status error' : 'status';
  }

  function registerBlocks() {
    if (!window.Blockly) throw new Error('Blockly n\'est pas chargé.');
    var B = window.Blockly;

    function simpleBlock(type, colour, message, args, previous, next, output) {
      if (B.Blocks[type]) return;
      B.Blocks[type] = {
        init: function () {
          this.jsonInit({
            type: type,
            message0: message,
            args0: args || [],
            previousStatement: previous !== false,
            nextStatement: next !== false,
            output: output || null,
            colour: colour,
            tooltip: type,
            helpUrl: ''
          });
        }
      };
    }

    simpleBlock('paper_plugin_start', 120, 'au démarrage du plugin', [], false, true);
    simpleBlock('paper_player_join', 120, 'quand un joueur rejoint', [], false, true);
    simpleBlock('paper_player_quit', 120, 'quand un joueur quitte', [], false, true);
    simpleBlock('paper_player_chat', 120, 'quand un joueur écrit un message', [], false, true);
    simpleBlock('paper_message', 210, 'envoyer au joueur %1', [{type:'field_input', name:'TEXT', text:'Bonjour !'}], true, true);
    simpleBlock('paper_command', 210, 'exécuter la commande %1', [{type:'field_input', name:'COMMAND', text:'say Hello'}], true, true);
    simpleBlock('paper_give', 210, 'donner %1 quantité %2', [{type:'field_input', name:'ITEM', text:'DIAMOND'},{type:'field_number', name:'AMOUNT', value:1, min:1}], true, true);
    simpleBlock('paper_teleport', 210, 'téléporter vers X %1 Y %2 Z %3', [{type:'field_number', name:'X', value:0},{type:'field_number', name:'Y', value:64},{type:'field_number', name:'Z', value:0}], true, true);
    simpleBlock('paper_sound', 210, 'jouer le son %1', [{type:'field_input', name:'SOUND', text:'ENTITY_PLAYER_LEVELUP'}], true, true);
    simpleBlock('paper_broadcast', 160, 'broadcast %1', [{type:'field_input', name:'TEXT', text:'Message'}], true, true);
    simpleBlock('paper_time', 160, 'mettre l’heure à %1', [{type:'field_number', name:'TIME', value:1000, min:0}], true, true);
    simpleBlock('paper_weather', 160, 'météo %1', [{type:'field_dropdown', name:'WEATHER', options:[['clair','CLEAR'],['pluie','RAIN'],['orage','THUNDER']]}], true, true);
    simpleBlock('paper_wait', 60, 'attendre %1 secondes', [{type:'field_number', name:'SECONDS', value:1, min:0}], true, true);
    simpleBlock('paper_log', 290, 'console : %1', [{type:'field_input', name:'TEXT', text:'Debug'}], true, true);
    simpleBlock('paper_string', 290, 'texte %1', [{type:'field_input', name:'TEXT', text:'texte'}], false, false, 'String');
    simpleBlock('paper_number', 290, 'nombre %1', [{type:'field_number', name:'VALUE', value:0}], false, false, 'Number');

    if (!B.Blocks.paper_if) {
      B.Blocks.paper_if = {
        init: function () {
          this.jsonInit({type:'paper_if',message0:'si %1',args0:[{type:'input_value',name:'COND',check:'Boolean'}],message1:'faire %1',args1:[{type:'input_statement',name:'DO'}],previousStatement:true,nextStatement:true,colour:60});
        }
      };
    }
    if (!B.Blocks.paper_ifelse) {
      B.Blocks.paper_ifelse = {
        init: function () {
          this.jsonInit({type:'paper_ifelse',message0:'si %1',args0:[{type:'input_value',name:'COND',check:'Boolean'}],message1:'alors %1',args1:[{type:'input_statement',name:'DO'}],message2:'sinon %1',args2:[{type:'input_statement',name:'ELSE'}],previousStatement:true,nextStatement:true,colour:60});
        }
      };
    }
    if (!B.Blocks.paper_compare) {
      B.Blocks.paper_compare = {
        init: function () {
          this.jsonInit({type:'paper_compare',message0:'%1 %2 %3',args0:[{type:'input_value',name:'A'},{type:'field_dropdown',name:'OP',options:[['=','EQ'],['≠','NEQ'],['>','GT'],['<','LT'],['≥','GTE'],['≤','LTE']]},{type:'input_value',name:'B'}],output:'Boolean',colour:60});
        }
      };
    }
    if (!B.Blocks.paper_boolean) {
      B.Blocks.paper_boolean = {
        init: function () { this.jsonInit({type:'paper_boolean',message0:'%1',args0:[{type:'field_dropdown',name:'VALUE',options:[['vrai','TRUE'],['faux','FALSE']]}],output:'Boolean',colour:60}); }
      };
    }
  }

  function makeToolbox() {
    return {
      kind: 'categoryToolbox',
      contents: [
        {kind:'category',name:'Événements',colour:'120',contents:[
          {kind:'block',type:'paper_plugin_start'},
          {kind:'block',type:'paper_player_join'},
          {kind:'block',type:'paper_player_quit'},
          {kind:'block',type:'paper_player_chat'}
        ]},
        {kind:'category',name:'Joueur',colour:'210',contents:[
          {kind:'block',type:'paper_message'},
          {kind:'block',type:'paper_command'},
          {kind:'block',type:'paper_give'},
          {kind:'block',type:'paper_teleport'},
          {kind:'block',type:'paper_sound'}
        ]},
        {kind:'category',name:'Monde',colour:'160',contents:[
          {kind:'block',type:'paper_broadcast'},
          {kind:'block',type:'paper_time'},
          {kind:'block',type:'paper_weather'}
        ]},
        {kind:'category',name:'Contrôle',colour:'60',contents:[
          {kind:'block',type:'controls_if'},
          {kind:'block',type:'controls_repeat_ext'},
          {kind:'block',type:'paper_if'},
          {kind:'block',type:'paper_ifelse'},
          {kind:'block',type:'paper_wait'}
        ]},
        {kind:'category',name:'Logique',colour:'60',contents:[
          {kind:'block',type:'logic_compare'},
          {kind:'block',type:'logic_boolean'},
          {kind:'block',type:'paper_compare'},
          {kind:'block',type:'paper_boolean'},
          {kind:'block',type:'logic_operation'},
          {kind:'block',type:'logic_negate'}
        ]},
        {kind:'category',name:'Texte & valeurs',colour:'290',contents:[
          {kind:'block',type:'paper_string'},
          {kind:'block',type:'paper_number'},
          {kind:'block',type:'text'},
          {kind:'block',type:'math_number'}
        ]},
        {kind:'category',name:'Variables',custom:'VARIABLE',colour:'330'},
        {kind:'category',name:'Procédures',custom:'PROCEDURE',colour:'290'},
        {kind:'category',name:'Console',colour:'290',contents:[{kind:'block',type:'paper_log'}]}
      ]
    };
  }

  function initBlockly() {
    try {
      if (!window.Blockly) throw new Error('Blockly est indisponible.');
      registerBlocks();
      var host = byId('blocklyDiv');
      if (!host) return;
      workspace = window.Blockly.inject(host, {
        toolbox: makeToolbox(),
        grid: {spacing:20,length:3,colour:'#334155',snap:true},
        zoom: {controls:true,wheel:true,startScale:0.9,maxScale:1.4,minScale:0.55},
        trashcan: true,
        move: {scrollbars:true,drag:true,dragOutside:true}
      });
      loadWorkspace();
      workspace.addChangeListener(function () { saveWorkspace(); updateCode(); });
      updateCode();
      resizeBlockly();
      notify('Blockly prêt.');
    } catch (e) {
      notify('Erreur Blockly : ' + e.message, true);
      console.error(e);
    }
  }

  function resizeBlockly() {
    if (!workspace || !window.Blockly) return;
    var host = byId('blocklyDiv');
    if (host) window.Blockly.svgResize(workspace);
  }

  function saveWorkspace() {
    if (!workspace || !window.Blockly.serialization) return;
    try { localStorage.setItem('paperStudioWorkspace', JSON.stringify(window.Blockly.serialization.workspaces.save(workspace))); } catch (e) {}
  }

  function loadWorkspace() {
    if (!workspace || !window.Blockly.serialization) return;
    try {
      var raw = localStorage.getItem('paperStudioWorkspace');
      if (raw) window.Blockly.serialization.workspaces.load(JSON.parse(raw), workspace);
    } catch (e) { console.warn(e); }
  }

  function clearWorkspace() {
    if (!workspace) return;
    workspace.clear();
    saveWorkspace();
    updateCode();
  }

  function javaForBlock(block) {
    var t = block.type;
    if (t === 'paper_message') return 'player.sendMessage("' + escJava(block.getFieldValue('TEXT')) + '");';
    if (t === 'paper_command') return 'player.performCommand("' + escJava(block.getFieldValue('COMMAND')) + '");';
    if (t === 'paper_give') return 'player.getInventory().addItem(new ItemStack(Material.' + safeJava(block.getFieldValue('ITEM'), 'STONE') + ', ' + Number(block.getFieldValue('AMOUNT') || 1) + '));';
    if (t === 'paper_teleport') return 'player.teleport(new Location(player.getWorld(), ' + Number(block.getFieldValue('X') || 0) + ', ' + Number(block.getFieldValue('Y') || 64) + ', ' + Number(block.getFieldValue('Z') || 0) + '));';
    if (t === 'paper_sound') return 'player.playSound(player.getLocation(), Sound.' + safeJava(block.getFieldValue('SOUND'), 'ENTITY_PLAYER_LEVELUP') + ', 1.0f, 1.0f);';
    if (t === 'paper_broadcast') return 'Bukkit.broadcastMessage("' + escJava(block.getFieldValue('TEXT')) + '");';
    if (t === 'paper_time') return 'player.getWorld().setTime(' + Number(block.getFieldValue('TIME') || 0) + 'L);';
    if (t === 'paper_weather') return 'player.getWorld().setStorm(' + (block.getFieldValue('WEATHER') !== 'CLEAR') + ');';
    if (t === 'paper_wait') return '// attendre ' + Number(block.getFieldValue('SECONDS') || 0) + ' seconde(s)';
    if (t === 'paper_log') return 'getLogger().info("' + escJava(block.getFieldValue('TEXT')) + '");';
    if (t === 'paper_plugin_start') return '// Événement : démarrage du plugin';
    if (t === 'paper_player_join') return '// Événement : PlayerJoinEvent';
    if (t === 'paper_player_quit') return '// Événement : PlayerQuitEvent';
    if (t === 'paper_player_chat') return '// Événement : AsyncPlayerChatEvent';
    if (t === 'paper_if') return 'if (' + valueForBlock(block.getInputTargetBlock('COND')) + ') {\n' + statements(block.getInputTargetBlock('DO'), 2) + '\n}';
    if (t === 'paper_ifelse') return 'if (' + valueForBlock(block.getInputTargetBlock('COND')) + ') {\n' + statements(block.getInputTargetBlock('DO'), 2) + '\n} else {\n' + statements(block.getInputTargetBlock('ELSE'), 2) + '\n}';
    if (t === 'controls_repeat_ext') return 'for (int i = 0; i < ' + valueForBlock(block.getInputTargetBlock('TIMES')) + '; i++) {\n' + statements(block.getInputTargetBlock('DO'), 2) + '\n}';
    if (t === 'controls_if') return '// Bloc if Blockly';
    return '// ' + t;
  }

  function valueForBlock(block) {
    if (!block) return 'true';
    if (block.type === 'logic_boolean' || block.type === 'paper_boolean') return block.getFieldValue('BOOL') || (block.getFieldValue('VALUE') === 'TRUE' ? 'true' : 'false');
    if (block.type === 'math_number') return String(block.getFieldValue('NUM'));
    if (block.type === 'paper_number') return String(block.getFieldValue('VALUE'));
    if (block.type === 'paper_string') return '"' + escJava(block.getFieldValue('TEXT')) + '"';
    if (block.type === 'paper_compare') {
      var a = valueForBlock(block.getInputTargetBlock('A'));
      var b = valueForBlock(block.getInputTargetBlock('B'));
      var op = block.getFieldValue('OP') || 'EQ';
      return a + ({EQ:' == ',NEQ:' != ',GT:' > ',LT:' < ',GTE:' >= ',LTE:' <= '}[op] || ' == ') + b;
    }
    return 'true';
  }

  function statements(first, indent) {
    var out = [];
    var b = first;
    while (b) {
      var line = javaForBlock(b).split('\n');
      var i;
      for (i=0;i<line.length;i++) out.push(spaces(indent) + line[i]);
      b = b.getNextBlock();
    }
    return out.join('\n');
  }

  function updateCode() {
    var out = byId('generatedCode');
    if (!out || !workspace) return;
    var tops = workspace.getTopBlocks(true);
    var chunks = [];
    var i;
    for (i=0;i<tops.length;i++) chunks.push(javaForBlock(tops[i]));
    out.value = chunks.join('\n\n');
  }

  function spaces(n) { return new Array(n + 1).join(' '); }
  function escJava(s) { return String(s || '').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,'\\n'); }
  function safeJava(s, fallback) { var x = String(s || fallback).replace(/[^A-Za-z0-9_]/g,''); return x || fallback; }

  function bindUI() {
    var links = document.querySelectorAll('[data-page]');
    var i;
    for (i=0;i<links.length;i++) links[i].addEventListener('click', function () { showPage(this.getAttribute('data-page')); });
    var clear = byId('clearWorkspace'); if (clear) clear.addEventListener('click', clearWorkspace);
    var save = byId('saveProject'); if (save) save.addEventListener('click', function(){saveAll(); notify('Projet sauvegardé.');});
    var exportBtn = byId('exportProject'); if (exportBtn) exportBtn.addEventListener('click', exportProject);
    var importInput = byId('importFile'); if (importInput) importInput.addEventListener('change', importProject);
    var addCommand = byId('addCommand'); if (addCommand) addCommand.addEventListener('click', addCommandRow);
    var addPermission = byId('addPermission'); if (addPermission) addPermission.addEventListener('click', addPermissionRow);
    var addConfig = byId('addConfig'); if (addConfig) addConfig.addEventListener('click', addConfigRow);
    var addData = byId('addData'); if (addData) addData.addEventListener('click', addDataRow);
    var code = byId('customCode'); if (code) code.addEventListener('input', function(){state.customCode=code.value;saveAll();});
    window.addEventListener('resize', resizeBlockly);
  }

  function addRow(containerId, html) { var c=byId(containerId); if (!c) return; var d=document.createElement('div'); d.className='row'; d.innerHTML=html; c.appendChild(d); saveAll(); }
  function addCommandRow(){addRow('commandsList','<input class="field" placeholder="nom"><input class="field" placeholder="permission"><button class="danger removeRow">Supprimer</button>');}
  function addPermissionRow(){addRow('permissionsList','<input class="field" placeholder="permission.node"><input class="field" placeholder="Description"><button class="danger removeRow">Supprimer</button>');}
  function addConfigRow(){addRow('configList','<input class="field" placeholder="clé"><input class="field" placeholder="valeur"><button class="danger removeRow">Supprimer</button>');}
  function addDataRow(){addRow('dataList','<input class="field" placeholder="clé"><input class="field" placeholder="type"><input class="field" placeholder="valeur"><button class="danger removeRow">Supprimer</button>');}

  function saveAll(){
    state.customCode=(byId('customCode')||{}).value||'';
    try{localStorage.setItem('paperStudioState',JSON.stringify(state));}catch(e){}
  }
  function loadAll(){
    try{var raw=localStorage.getItem('paperStudioState');if(raw) state=JSON.parse(raw);}catch(e){}
    var code=byId('customCode');if(code)code.value=state.customCode||'';
  }

  function exportProject(){
    saveAll();
    var data={paperStudioVersion:1,state:state,workspace:workspace&&window.Blockly.serialization?window.Blockly.serialization.workspaces.save(workspace):null,generatedJava:(byId('generatedCode')||{}).value||''};
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='paper-studio-project.json';a.click();URL.revokeObjectURL(a.href);
  }
  function importProject(e){
    var file=e.target.files&&e.target.files[0];if(!file)return;
    var r=new FileReader();r.onload=function(){try{var data=JSON.parse(r.result);if(data.state)state=data.state;if(data.workspace&&workspace)window.Blockly.serialization.workspaces.load(data.workspace,workspace);loadAll();updateCode();notify('Projet importé.');}catch(err){notify('Import invalide : '+err.message,true);}};r.readAsText(file);
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadAll();
    bindUI();
    initBlockly();
    showPage('projects');
  });
})();
