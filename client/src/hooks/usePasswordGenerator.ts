export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

export const usePasswordGenerator = () => {
  const generateStrongPassword = (length: number = 16): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = "";

    // Garantir pelo menos um de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Preencher o resto aleatoriamente
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Embaralhar a password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

    const strengths: PasswordStrength[] = [
      { score: 0, label: "Muito Fraca", color: "bg-red-500" },
      { score: 1, label: "Fraca", color: "bg-orange-500" },
      { score: 2, label: "Média", color: "bg-yellow-500" },
      { score: 3, label: "Forte", color: "bg-lime-500" },
      { score: 4, label: "Muito Forte", color: "bg-green-500" },
    ];

    return strengths[Math.min(score, 4)];
  };

  return {
    generateStrongPassword,
    checkPasswordStrength,
  };
};
