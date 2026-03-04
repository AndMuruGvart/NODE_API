import { validateUserInput } from "../validators";

describe("validators", () => {
  describe("validateUserInput", () => {
    it("should validate correct email and dob", () => {
      const result = validateUserInput("user@example.com", "1990-01-15", {
        minAge: 18,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should reject invalid email format", () => {
      const result = validateUserInput("invalid-email", "1990-01-15", {
        minAge: 18,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("email");
    });

    it("should reject email that is too long", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const result = validateUserInput(longEmail, "1990-01-15", {
        minAge: 18,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("email");
    });

    it("should reject empty email", () => {
      const result = validateUserInput("", "1990-01-15", {
        minAge: 18,
      });

      expect(result.valid).toBe(false);
    });

    it("should reject user younger than minimum age", () => {
      const today = new Date();
      const youngerThan18 = new Date(
        today.getFullYear() - 17,
        today.getMonth(),
        today.getDate(),
      );
      const dobString = youngerThan18.toISOString().split("T")[0];

      const result = validateUserInput("user@example.com", dobString, {
        minAge: 18,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("dob");
    });

    it("should reject user older than maximum age", () => {
      const result = validateUserInput("user@example.com", "1850-01-01", {
        minAge: 18,
        maxAge: 120,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveProperty("dob");
    });

    it("should reject future dates by default", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dobString = tomorrow.toISOString().split("T")[0];

      const result = validateUserInput("user@example.com", dobString, {
        minAge: 18,
        allowFuture: false,
      });

      expect(result.valid).toBe(false);
    });

    it("should accept future dates when allowFuture is true", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dobString = tomorrow.toISOString().split("T")[0];

      const result = validateUserInput("user@example.com", dobString, {
        minAge: 0,
        allowFuture: true,
      });

      expect(result.valid).toBe(true);
    });

    it("should handle Date object input for dob", () => {
      const dob = new Date("1990-01-15");
      const result = validateUserInput("user@example.com", dob, {
        minAge: 18,
      });

      expect(result.valid).toBe(true);
    });

    it("should skip email validation when disabled", () => {
      const result = validateUserInput("invalid", "1990-01-15", {
        minAge: 18,
        shouldValidateEmail: false,
      });

      expect(result.errors).not.toHaveProperty("email");
    });

    it("should skip dob validation when disabled", () => {
      const result = validateUserInput("user@example.com", "invalid-date", {
        minAge: 18,
        shouldValidateDOB: false,
      });

      expect(result.errors).not.toHaveProperty("dob");
    });

    it("should return multiple errors when both email and dob are invalid", () => {
      const result = validateUserInput("invalid", "2030-01-01", {
        minAge: 18,
        allowFuture: false,
      });

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });
});
