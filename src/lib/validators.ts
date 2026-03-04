interface ValidateDOBOptions {
  minAge?: number;
  maxAge?: number;
  allowFuture?: boolean;
}

interface UserValidationOptions extends ValidateDOBOptions {
  shouldValidateEmail?: boolean;
  shouldValidateDOB?: boolean;
}

type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

const isISODateString = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const parseISODate = (value: string): Date | null => {
  if (!isISODateString(value)) return null;

  const date = new Date(value + "T00:00:00Z");
  return isNaN(date.getTime()) ? null : date;
};

const isValidEmail = (email: string): boolean => {
  const trimmed = email.trim();

  if (!trimmed || trimmed.length > 254) return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

  return emailRegex.test(trimmed);
};

const validateDOB = (
  dob: string | Date,
  options: ValidateDOBOptions,
): string | null => {
  const { minAge = 18, maxAge = 120, allowFuture = false } = options;

  let dobDate: Date | null = null;

  if (typeof dob === "string") {
    dobDate = parseISODate(dob);
  } else if (dob instanceof Date) {
    dobDate = new Date(dob.getTime());
  }

  if (!dobDate) {
    return "Invalid date format. Use YYYY-MM-DD";
  }

  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  if (dobDate > todayUTC) {
    if (!allowFuture) {
      return "Date of birth cannot be in the future";
    }
    // if future dates are allowed, skip any age-related validations
    return null;
  }

  let age = todayUTC.getUTCFullYear() - dobDate.getUTCFullYear();
  const monthDiff = todayUTC.getUTCMonth() - dobDate.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && todayUTC.getUTCDate() < dobDate.getUTCDate())
  ) {
    age--;
  }

  if (age < minAge) {
    return `User must be at least ${minAge} years old`;
  }

  if (age > maxAge) {
    return `Invalid age. Maximum allowed age is ${maxAge}`;
  }

  return null;
};

export const validateUserInput = (
  email: string,
  dob: string | Date,
  options: UserValidationOptions = {},
): ValidationResult => {
  const {
    shouldValidateEmail = true,
    shouldValidateDOB = true,
    minAge = 18,
    maxAge = 120,
    allowFuture = false,
  } = options;

  const errors: Record<string, string> = {};

  // EMAIL
  if (shouldValidateEmail) {
    if (!email || !email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      errors.email = "Invalid email format";
    }
  }

  // Date of birth
  if (shouldValidateDOB) {
    if (!dob) {
      errors.dob = "Date of birth is required";
    } else {
      const dobError = validateDOB(dob, {
        minAge,
        maxAge,
        allowFuture,
      });

      if (dobError) {
        errors.dob = dobError;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
