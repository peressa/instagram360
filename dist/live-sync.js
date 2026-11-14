/* Field-level optimistic collaboration. Conflicting edits stay in the local outbox. */
class LiveProjectSync {
 constructor({state={},clientId,onChange=()=>{},onState=()=>{},persist=()=>{},send=()=>false}){
  this.remote=state.remote||{};this.revision=state.revision||0;this.baseline=state.baseline||this.remote;this.pending=new Map((state.pending||[]).map(op=>[op.key,op]));this.flight=state.flight||null;this.sequence=state.sequence||0;this.clientId=clientId;this.onChange=onChange;this.onState=onState;this.persist=persist;this.send=send;this.connected=false;this.conflicts=[];this.undoStack=[];this.redoStack=[];
 }
 state(){return {remote:this.remote,revision:this.revision,baseline:this.baseline,pending:[...this.pending.values()],flight:this.flight,sequence:this.sequence}}
 effective(){return SharedProjectModel.apply(this.remote,[...this.pending.values()])}
 changed(){this.persist(this.state());this.onState(this);this.onChange(this)}
 setBaseline(values){this.baseline=SharedProjectModel.apply(values,[]);this.persist(this.state())}
 capture(values,history=true){
  const ops=SharedProjectModel.diff(this.baseline,values);this.baseline=SharedProjectModel.apply(values,[]);if(!ops.length)return;
  if(history){this.undoStack.push(ops);if(this.undoStack.length>60)this.undoStack.shift();this.redoStack=[]}
  this.enqueue(ops);this.changed();this.pump();
 }
 enqueue(ops){for(const op of ops){const old=this.pending.get(op.key),next={...op};if(old){next.before=old.before;next.missing=old.missing}this.pending.set(op.key,next)}}
 snapshot(data){if(data.revision<this.revision)return;this.remote=data.values;this.revision=data.revision;this.detectConflicts();this.changed()}
 open(snapshot){this.connected=true;this.snapshot(snapshot);if(this.flight){this.send({type:'patch',...this.flight})}else this.pump()}
 close(){this.connected=false;this.onState(this)}
 detectConflicts(){this.conflicts=[];for(const op of this.pending.values()){const current=this.remote[op.key],before=op.missing?undefined:op.before,after=op.remove?undefined:op.value;if(SharedProjectModel.equal(current,after)&&!this.flight){this.pending.delete(op.key);continue}if(!SharedProjectModel.equal(current,before)&&!SharedProjectModel.equal(current,after)){const merged=SharedProjectModel.mergePatch(this.remote,[op]);if(merged.conflicts.length)this.conflicts.push(op.key);else if(!this.flight&&merged.ops.length){op.before=current;op.missing=current===undefined;op.value=merged.ops[0].value}}}}
 receive(message){
  if(message.type==='snapshot'){this.open(message);return}
  if(message.type==='patch'){
   if(message.revision>this.revision+1){this.connected=false;this.onState(this);return 'resync'}
   if(message.revision>=this.revision){this.remote=SharedProjectModel.apply(this.remote,message.ops);this.revision=message.revision}
   if(this.flight?.id===message.id)this.finishFlight();this.detectConflicts();this.changed();this.pump();return;
  }
  if(message.type==='ack'&&this.flight?.id===message.id){this.finishFlight();this.detectConflicts();this.changed();this.pump();return}
  if(message.type==='conflict'&&this.flight?.id===message.id){this.flight=null;this.remote=message.values;this.revision=message.revision;this.detectConflicts();this.changed();return}
  if(message.type==='error'){this.connected=false;this.onState(this);return 'resync'}
 }
 finishFlight(){
  for(const sent of this.flight.ops){const pending=this.pending.get(sent.key);if(!pending)continue;if(pending.remove===sent.remove&&SharedProjectModel.equal(pending.value,sent.value))this.pending.delete(sent.key);else{pending.before=sent.value;pending.missing=sent.remove}}
  this.flight=null;
 }
 pump(){
  if(!this.connected||this.flight||this.conflicts.length||!this.pending.size)return;
  const ops=[...this.pending.values()].map(op=>({...op}));this.flight={id:this.clientId+':'+(++this.sequence),ops};this.persist(this.state());if(!this.send({type:'patch',...this.flight}))this.connected=false;this.onState(this);
 }
 retryMine(){for(const op of this.pending.values()){op.before=this.remote[op.key]??null;op.missing=this.remote[op.key]===undefined}this.conflicts=[];this.flight=null;this.changed();this.pump()}
 acceptRemote(){this.pending.clear();this.flight=null;this.conflicts=[];this.undoStack=[];this.redoStack=[];this.changed()}
 undo(){const last=this.undoStack.at(-1);if(!last)return;const current=this.effective();if(last.some(op=>!SharedProjectModel.equal(current[op.key],op.remove?undefined:op.value)))return false;this.undoStack.pop();this.redoStack.push(last);const inverse=last.map(op=>({key:op.key,before:current[op.key]??null,missing:current[op.key]===undefined,value:op.before,remove:op.missing}));this.enqueue(inverse);this.changed();this.pump();return true}
 redo(){const ops=this.redoStack.pop();if(!ops)return;const current=this.effective();if(ops.some(op=>!SharedProjectModel.equal(current[op.key],op.missing?undefined:op.before))){this.redoStack.push(ops);return false}this.undoStack.push(ops);this.enqueue(ops.map(op=>({...op,before:current[op.key]??null,missing:current[op.key]===undefined})));this.changed();this.pump();return true}
 get canUndo(){return !!this.undoStack.length}get canRedo(){return !!this.redoStack.length}
}
if(typeof module!=='undefined')module.exports=LiveProjectSync;
