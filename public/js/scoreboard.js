// scoreboard.js yang diperbarui
document.addEventListener('DOMContentLoaded', function() {
  const socket = io();
  
  // Mendapatkan match ID dari atribut data
  const matchId = document.body.getAttribute('data-match-id');
  const matchType = document.body.getAttribute('data-match-type') || 'single';
  
  // Inisialisasi service indicator jika ada
  const indicator = document.getElementById('serviceIndicator');
  if (indicator) {
    indicator.className = 'shuttle service-a';
  }
  
  if (matchId) {
    console.log("Connected to match ID:", matchId);
    
    // Menangani pembaruan skor
    socket.on('scoreUpdate', function(data) {
      console.log("Score update received:", data);
      if (data.matchId === parseInt(matchId)) {
        updateScoreboard(data);
      }
    });
    
    // Menangani perpindahan sisi
    socket.on('switchSides', function(data) {
      console.log("Side switch received:", data);
      if (data.matchId === parseInt(matchId)) {
        // Muat ulang untuk mendapatkan posisi pemain yang diperbarui
        location.reload();
      }
    });
  } else {
    console.error("No match ID found in body data attribute");
  }
  
  function updateScoreboard(data) {
    console.log("Updating scoreboard with data:", data);
    
    // Update skor utama
    const sideAMainScore = document.getElementById('sideAMainScore');
    const sideBMainScore = document.getElementById('sideBMainScore');
    
    if (sideAMainScore) sideAMainScore.textContent = data.sideAScore;
    if (sideBMainScore) sideBMainScore.textContent = data.sideBScore;
    
    // Update skor set
    const setAScore = document.getElementById(`setA${data.setNumber}`);
    const setBScore = document.getElementById(`setB${data.setNumber}`);
    
    if (setAScore) setAScore.textContent = data.sideAScore;
    if (setBScore) setBScore.textContent = data.sideBScore;
    
    // Update indikator servis dengan detail lebih
    const indicator = document.getElementById('serviceIndicator');
    if (indicator) {
      // Reset kelas
      indicator.className = 'shuttle';
      
      // Tambahkan kelas service side
      indicator.classList.add(`service-${data.service.toLowerCase()}`);
      
      // Tambahkan kelas posisi server jika tersedia
      if (data.serverPosition) {
        indicator.classList.add(`server-${data.serverPosition}`);
      }
      
      // Tambahkan kelas pemain server untuk doubles jika tersedia
      if (matchType === 'double' && data.serverPlayer) {
        indicator.classList.add(`player-${data.serverPlayer}`);
      }
    }
    
    // Update informasi servis jika elemen ada
    const serviceInfo = document.getElementById('serviceInfo');
    if (serviceInfo && data.service) {
      let infoText = `Servis: Side ${data.service}`;
      
      if (data.serverPosition) {
        infoText += ` (${data.serverPosition === 'right' ? 'kanan' : 'kiri'})`;
      }
      
      if (matchType === 'double' && data.serverPlayer) {
        infoText += ` - Pemain ${data.serverPlayer}`;
      }
      
      serviceInfo.textContent = infoText;
    }
  }
});