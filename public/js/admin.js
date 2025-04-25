// admin.js
document.addEventListener('DOMContentLoaded', function() {
    // Match setup form toggle doubles fields
    const matchTypeSelect = document.getElementById('matchType');
    if (matchTypeSelect) {
      matchTypeSelect.addEventListener('change', function() {
        const doublesFields = document.querySelectorAll('.doubles-only');
        const isDoubles = this.value === 'double';
        
        doublesFields.forEach(field => {
          if (isDoubles) {
            field.style.display = 'block';
            field.querySelectorAll('input').forEach(input => {
              if (input.id.startsWith('player')) {
                input.required = true;
              }
            });
          } else {
            field.style.display = 'none';
            field.querySelectorAll('input').forEach(input => {
              input.required = false;
            });
          }
        });
      });
      
      // Initialize on page load
      matchTypeSelect.dispatchEvent(new Event('change'));
    }
  });  