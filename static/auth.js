const addContactButton = document.getElementById('add-contact');
const contactFields = document.getElementById('contact-fields');

if (addContactButton && contactFields) {
    addContactButton.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'contact-row';
        row.innerHTML = `
            <input name="contact_name[]" placeholder="Contact name" required>
            <input type="tel" name="contact_number[]" placeholder="Mobile number" required>
            <button class="remove-contact" type="button">Remove</button>
        `;
        row.querySelector('.remove-contact').addEventListener('click', () => row.remove());
        contactFields.appendChild(row);
    });
}
