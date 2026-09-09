document.getElementById('contact-form').addEventListener('submit', function (e) {
      e.preventDefault();
      document.getElementById('form-note').textContent = 'Message sent — thanks for reaching out.';
      this.reset();
    });

    document.querySelectorAll('[data-target]').forEach(function (el) {
      el.addEventListener('click', function () {
        var target = document.getElementById(this.getAttribute('data-target'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });