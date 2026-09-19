try { 
  JSON.parse('\uFEFF{"a": 1}'); 
  console.log('success'); 
} catch(e) { 
  console.log('error', e.message); 
}
