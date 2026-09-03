(function () {
  'use strict';

  var B = window.Blockly;
  var workspace = null;
  var commandWorkspace = null;

  function $(id) { return document.getElementById(id); }
  function status(text, error) {
    var el = $('appStatus');
    if (!el) return;
    el.textContent = text;
    el.className = error ? 'status error' : 'status';
  }

  function showPage(name) {
    var pages = document.querySelectorAll('.page');
    var links = document.querySelectorAll('[data-page]');
    var i;
    for (i = 0; i < pages.length; i++) pages[i].classList.toggle('active', pages[i].id === 'page-' + name);
    for (i = 0; i < links.length; i++) links[i].classList.toggle('active', links[i].getAttribute('data-page') === name);
    var title = $('pageTitle');
    if (title) title.textContent = name === 'procedures' ? 'Procédures' : (name === 'commands' ? 'Commandes Brigadier' : name.charAt(0).toUpperCase() + name.slice(1));
    if (name === 'procedures' && workspace) B.svgResize(workspace);
    if (name === 'commands' && commandWorkspace) B.svgResize(commandWorkspace);
  }
  window.openPage = showPage;

  function block(type, colour, json) {
    if (B.Blocks[type]) return;
    B.Blocks[type] = { init: function () { this.jsonInit(json); } };
  }

  function registerProcedureBlocks() {
    block('paper_start', 120, {type:'paper_start', message0:'au démarrage du plugin', previousStatement:false, nextStatement:true, colour:120});
    block('paper_join', 120, {type:'paper_join', message0:'quand un joueur rejoint', previousStatement:false, nextStatement:true, colour:120});
    block('paper_quit', 120, {type:'paper_quit', message0:'quand un joueur quitte', previousStatement:false, nextStatement:true, colour:120});
    block('paper_chat', 120, {type:'paper_chat', message0:'quand un joueur écrit', previousStatement:false, nextStatement:true, colour:120});
    block('paper_message', 210, {type:'paper_message', message0:'envoyer au joueur %1', args0:[{type:'field_input',name:'TEXT',text:'Bonjour !'}], previousStatement:true,nextStatement:true,colour:210});
    block('paper_command', 210, {type:'paper_command', message0:'exécuter la commande %1', args0:[{type:'field_input',name:'COMMAND',text:'say Hello'}], previousStatement:true,nextStatement:true,colour:210});
    block('paper_give', 210, {type:'paper_give', message0:'donner %1 quantité %2', args0:[{type:'field_input',name:'ITEM',text:'DIAMOND'},{type:'field_number',name:'AMOUNT',value:1,min:1}], previousStatement:true,nextStatement:true,colour:210});
    block('paper_teleport', 210, {type:'paper_teleport',message0:'téléporter X %1 Y %2 Z %3',args0:[{type:'field_number',name:'X',value:0},{type:'field_number',name:'Y',value:64},{type:'field_number',name:'Z',value:0}],previousStatement:true,nextStatement:true,colour:210});
    block('paper_sound',210,{type:'paper_sound',message0:'jouer le son %1',args0:[{type:'field_input',name:'SOUND',text:'ENTITY_PLAYER_LEVELUP'}],previousStatement:true,nextStatement:true,colour:210});
    block('paper_broadcast',160,{type:'paper_broadcast',message0:'broadcast %1',args0:[{type:'field_input',name:'TEXT',text:'Message'}],previousStatement:true,nextStatement:true,colour:160});
    block('paper_wait',60,{type:'paper_wait',message0:'attendre %1 secondes',args0:[{type:'field_number',name:'SECONDS',value:1,min:0}],previousStatement:true,nextStatement:true,colour:60});
    block('paper_log',290,{type:'paper_log',message0:'console : %1',args0:[{type:'field_input',name:'TEXT',text:'Debug'}],previousStatement:true,nextStatement:true,colour:290});
    block('paper_string',290,{type:'paper_string',message0:'texte %1',args0:[{type:'field_input',name:'TEXT',text:'texte'}],output:'String',colour:290});
    block('paper_number',290,{type:'paper_number',message0:'nombre %1',args0:[{type:'field_number',name:'VALUE',value:0}],output:'Number',colour:290});
  }

  function registerBrigadierBlocks() {
    block('brigadier_command', 20, {
      type:'brigadier_command', message0:'commande / %1', args0:[{type:'field_input',name:'NAME',text:'gamemode'}],
      message1:'enfants %1', args1:[{type:'input_statement',name:'CHILDREN'}],
      previousStatement:false,nextStatement:false,colour:20,tooltip:'Racine de l’arbre Brigadier'
    });
    block('brigadier_literal', 30, {
      type:'brigadier_literal', message0:'littéral %1', args0:[{type:'field_input',name:'NAME',text:'survival'}],
      message1:'enfants %1', args1:[{type:'input_statement',name:'CHILDREN'}],
      previousStatement:true,nextStatement:true,colour:30,tooltip:'Branche littérale Brigadier'
    });
    block('brigadier_argument', 40, {
      type:'brigadier_argument', message0:'argument %1 type %2', args0:[{type:'field_input',name:'NAME',text:'joueur'},{type:'field_dropdown',name:'TYPE',options:[['joueur','PLAYER'],['texte','STRING'],['texte libre','GREEDY_STRING'],['entier','INTEGER'],['nombre','DOUBLE'],['booléen','BOOL'],['position','LOCATION'],['objet','ITEM'],['bloc','BLOCK'],['monde','WORLD']]}],
      message1:'enfants %1', args1:[{type:'input_statement',name:'CHILDREN'}],
      previousStatement:true,nextStatement:true,colour:40,tooltip:'Argument typé Brigadier'
    });
    block('brigadier_requires', 50, {
      type:'brigadier_requires', message0:'permission requise %1', args0:[{type:'field_input',name:'PERMISSION',text:'plugin.command.use'}],
      previousStatement:true,nextStatement:true,colour:50
    });
    block('brigadier_executes', 60, {
      type:'brigadier_executes', message0:'exécuter', previousStatement:true,nextStatement:false,colour:60,tooltip:'Point terminal de la branche'
    });
    block('brigadier_suggest', 70, {
      type:'brigadier_suggest', message0:'suggestions %1', args0:[{type:'field_input',name:'VALUE',text:'apple'}],
      previousStatement:true,nextStatement:true,colour:70
    });
  }

  function procedureToolbox() {
    return {kind:'categoryToolbox',contents:[
      {kind:'category',name:'Événements',colour:'120',contents:[{kind:'block',type:'paper_start'},{kind:'block',type:'paper_join'},{kind:'block',type:'paper_quit'},{kind:'block',type:'paper_chat'}]},
      {kind:'category',name:'Joueur',colour:'210',contents:[{kind:'block',type:'paper_message'},{kind:'block',type:'paper_command'},{kind:'block',type:'paper_give'},{kind:'block',type:'paper_teleport'},{kind:'block',type:'paper_sound'}]},
      {kind:'category',name:'Monde',colour:'160',contents:[{kind:'block',type:'paper_broadcast'}]},
      {kind:'category',name:'Contrôle',colour:'60',contents:[{kind:'block',type:'controls_if'},{kind:'block',type:'controls_repeat_ext'},{kind:'block',type:'paper_wait'}]},
      {kind:'category',name:'Logique',colour:'60',contents:[{kind:'block',type:'logic_compare'},{kind:'block',type:'logic_boolean'},{kind:'block',type:'logic_operation'},{kind:'block',type:'logic_negate'}]},
      {kind:'category',name:'Texte & nombres',colour:'290',contents:[{kind:'block',type:'paper_string'},{kind:'block',type:'paper_number'},{kind:'block',type:'text'},{kind:'block',type:'math_number'}]},
      {kind:'category',name:'Variables',custom:'VARIABLE',colour:'330'},
      {kind:'category',name:'Procédures',custom:'PROCEDURE',colour:'290'},
      {kind:'category',name:'Console',colour:'290',contents:[{kind:'block',type:'paper_log'}]}
    ]};
  }

  function brigadierToolbox() {
    return {kind:'categoryToolbox',contents:[
      {kind:'category',name:'Arbre de commande',colour:'20',contents:[{kind:'block',type:'brigadier_command'},{kind:'block',type:'brigadier_literal'},{kind:'block',type:'brigadier_argument'},{kind:'block',type:'brigadier_requires'},{kind:'block',type:'brigadier_executes'},{kind:'block',type:'brigadier_suggest'}]},
      {kind:'category',name:'Arguments',colour:'40',contents:[{kind:'block',type:'brigadier_argument'}]},
      {kind:'category',name:'Conditions',colour:'50',contents:[{kind:'block',type:'brigadier_requires'}]},
      {kind:'category',name:'Fin d’exécution',colour:'60',contents:[{kind:'block',type:'brigadier_executes'}]}
    ]};
  }

  function initWorkspaces() {
    try {
      if (!B) throw new Error('Blockly indisponible');
      registerProcedureBlocks();
      registerBrigadierBlocks();
      if ($('blocklyDiv')) {
        workspace = B.inject('blocklyDiv',{toolbox:procedureToolbox(),grid:{spacing:20,length:3,colour:'#334155',snap:true},zoom:{controls:true,wheel:true,startScale:.9,maxScale:1.4,minScale:.55},trashcan:true,move:{scrollbars:true,drag:true,dragOutside:true}});
        load(workspace,'ps-procedures');
        workspace.addChangeListener(function(){save(workspace,'ps-procedures');updateProcedureCode();});
      }
      if ($('brigadierDiv')) {
        commandWorkspace = B.inject('brigadierDiv',{toolbox:brigadierToolbox(),grid:{spacing:20,length:3,colour:'#334155',snap:true},zoom:{controls:true,wheel:true,startScale:.9,maxScale:1.4,minScale:.55},trashcan:true,move:{scrollbars:true,drag:true,dragOutside:true}});
        load(commandWorkspace,'ps-brigadier');
        commandWorkspace.addChangeListener(function(){save(commandWorkspace,'ps-brigadier');updateBrigadierCode();});
      }
      updateProcedureCode(); updateBrigadierCode();
      status('Blockly prêt — arbre Brigadier disponible.');
    } catch (e) { status('Erreur Blockly : '+e.message,true); console.error(e); }
  }

  function save(ws,key){try{if(ws&&B.serialization)localStorage.setItem(key,JSON.stringify(B.serialization.workspaces.save(ws)));}catch(e){}}
  function load(ws,key){try{var raw=localStorage.getItem(key);if(raw&&ws&&B.serialization)B.serialization.workspaces.load(JSON.parse(raw),ws);}catch(e){console.warn(e);}}
  function clear(ws,key){if(ws){ws.clear();save(ws,key);}}

  function esc(s){return String(s||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,'\\n');}
  function indent(n){return new Array(n+1).join(' ');}

  function procedureCode(block) {
    var t=block.type;
    if(t==='paper_message')return'player.sendMessage("'+esc(block.getFieldValue('TEXT'))+'");';
    if(t==='paper_command')return'player.performCommand("'+esc(block.getFieldValue('COMMAND'))+'");';
    if(t==='paper_give')return'player.getInventory().addItem(new ItemStack(Material.'+String(block.getFieldValue('ITEM')||'STONE').replace(/[^A-Za-z0-9_]/g,'')+', '+Number(block.getFieldValue('AMOUNT')||1)+'));';
    if(t==='paper_teleport')return'player.teleport(new Location(player.getWorld(), '+Number(block.getFieldValue('X')||0)+', '+Number(block.getFieldValue('Y')||64)+', '+Number(block.getFieldValue('Z')||0)+'));';
    if(t==='paper_sound')return'player.playSound(player.getLocation(), Sound.'+String(block.getFieldValue('SOUND')||'ENTITY_PLAYER_LEVELUP').replace(/[^A-Za-z0-9_]/g,'')+', 1f, 1f);';
    if(t==='paper_broadcast')return'Bukkit.broadcastMessage("'+esc(block.getFieldValue('TEXT'))+'");';
    if(t==='paper_wait')return'// attendre '+Number(block.getFieldValue('SECONDS')||0)+' seconde(s)';
    if(t==='paper_log')return'getLogger().info("'+esc(block.getFieldValue('TEXT'))+'");';
    return'// '+t;
  }
  function chainCode(first,n){var out=[],b=first;while(b){out.push(indent(n)+procedureCode(b));b=b.getNextBlock();}return out.join('\n');}
  function updateProcedureCode(){var out=$('generatedCode');if(!out||!workspace)return;var tops=workspace.getTopBlocks(true),a=[],i;for(i=0;i<tops.length;i++)a.push(procedureCode(tops[i]));out.value=a.join('\n\n');}

  function brigadierLine(block, depth) {
    var t=block.type, pad=indent(depth);
    if(t==='brigadier_command') return pad+'COMMAND /'+block.getFieldValue('NAME');
    if(t==='brigadier_literal') return pad+'LITERAL '+block.getFieldValue('NAME');
    if(t==='brigadier_argument') return pad+'ARG '+block.getFieldValue('NAME')+': '+block.getFieldValue('TYPE').toLowerCase();
    if(t==='brigadier_requires') return pad+'REQUIRES '+block.getFieldValue('PERMISSION');
    if(t==='brigadier_executes') return pad+'EXECUTES';
    if(t==='brigadier_suggest') return pad+'SUGGEST '+block.getFieldValue('VALUE');
    return pad+t;
  }
  function brigadierTree(first,depth,out){var b=first;while(b){out.push(brigadierLine(b,depth));var child=b.getInputTargetBlock('CHILDREN');if(child)brigadierTree(child,depth+2,out);b=b.getNextBlock();}}
  function updateBrigadierCode(){var out=$('brigadierCode');if(!out||!commandWorkspace)return;var tops=commandWorkspace.getTopBlocks(true),lines=[],i;for(i=0;i<tops.length;i++)brigadierTree(tops[i],0,lines);out.value=lines.join('\n');}

  function addRow(container,fields){var box=$(container);if(!box)return;var row=document.createElement('div');row.className='row';var i;for(i=0;i<fields.length;i++){var input=document.createElement('input');input.className='field';input.placeholder=fields[i];row.appendChild(input);}var del=document.createElement('button');del.className='danger';del.textContent='Supprimer';del.onclick=function(){row.remove();};row.appendChild(del);box.appendChild(row);}

  function exportProject(){var data={version:2,procedures:workspace&&B.serialization?B.serialization.workspaces.save(workspace):null,brigadier:commandWorkspace&&B.serialization?B.serialization.workspaces.save(commandWorkspace):null};var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='paper-studio-project.json';a.click();}

  document.addEventListener('DOMContentLoaded',function(){
    var links=document.querySelectorAll('[data-page]'),i;
    for(i=0;i<links.length;i++)links[i].addEventListener('click',function(){showPage(this.getAttribute('data-page'));});
    if($('clearWorkspace'))$('clearWorkspace').onclick=function(){clear(workspace,'ps-procedures');updateProcedureCode();};
    if($('clearBrigadier'))$('clearBrigadier').onclick=function(){clear(commandWorkspace,'ps-brigadier');updateBrigadierCode();};
    if($('saveProject'))$('saveProject').onclick=function(){save(workspace,'ps-procedures');save(commandWorkspace,'ps-brigadier');status('Projet sauvegardé.');};
    if($('exportProject'))$('exportProject').onclick=exportProject;
    if($('addCommand'))$('addCommand').onclick=function(){addRow('commandsList',['commande','permission']);};
    if($('addPermission'))$('addPermission').onclick=function(){addRow('permissionsList',['permission','description']);};
    if($('addConfig'))$('addConfig').onclick=function(){addRow('configList',['clé','valeur']);};
    if($('addData'))$('addData').onclick=function(){addRow('dataList',['clé','type','valeur']);};
    initWorkspaces();
    showPage('projects');
    window.addEventListener('resize',function(){if(workspace)B.svgResize(workspace);if(commandWorkspace)B.svgResize(commandWorkspace);});
  });
})();
