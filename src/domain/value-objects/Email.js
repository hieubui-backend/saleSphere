/**
 * Email Value Object
 * Đảm bảo email luôn hợp lệ ngay từ lúc khởi tạo.
 */
class Email {
    constructor(value) {
        if (!value) {
            throw new Error('Email không được để trống');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error(`Email không hợp lệ: ${value}`);
        }

        this.value = value.toLowerCase().trim();
    }

    getValue() {
        return this.value;
    }

    equals(otherEmail) {
        if (!(otherEmail instanceof Email)) return false;
        return this.value === otherEmail.getValue();
    }
}

module.exports = Email;
