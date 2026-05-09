/**
 * Email Value Object
 * Đảm bảo email luôn hợp lệ ngay từ lúc khởi tạo.
 */
export default class Email {
    private readonly value: string;

    constructor(value: string) {
        if (!value) {
            throw new Error('Email không được để trống');
        }
        
        const cleanedValue = value.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanedValue)) {
            throw new Error(`Email không hợp lệ: ${value}`);
        }

        this.value = cleanedValue;
    }

    public getValue(): string {
        return this.value;
    }

    public equals(otherEmail: Email): boolean {
        if (!(otherEmail instanceof Email)) return false;
        return this.value === otherEmail.getValue();
    }
}





