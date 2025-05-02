/**
 * Different categories of errors for better handling
 */
import { formatDateISO, nowUTC } from './dateUtils';

export enum ErrorCategory {
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONVERSION = 'CONVERSION_ERROR',
  NETWORK = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * Custom error class with additional properties for better error handling
 */
export class AppError extends Error {
  /** The error category for grouping similar errors */
  public category: ErrorCategory;
  
  /** Original error if this is wrapping another error */
  public originalError?: Error | unknown;
  
  /** HTTP status code if applicable */
  public statusCode?: number;
  
  /** Additional context/metadata about the error */
  public context?: Record<string, unknown>;
  
  /**
   * Create a new application error
   * @param message Human-readable error message
   * @param category Error category for grouping
   * @param originalError Original error if wrapping
   * @param statusCode HTTP status code if applicable
   * @param context Additional error context
   */
  constructor(
    message: string, 
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    originalError?: Error | unknown,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.originalError = originalError;
    this.statusCode = statusCode;
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  /**
   * Gets a safe error message for display to end-users
   * Hides technical details while providing useful information
   * @returns A user-friendly error message
   */
  public getUserFriendlyMessage(): string {
    // Customize message based on error category
    switch (this.category) {
      case ErrorCategory.API:
        return 'There was a problem communicating with an external service. Please try again later.';
      case ErrorCategory.VALIDATION:
        return this.message; // Validation errors can be shown to users
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please sign in again.';
      case ErrorCategory.PERMISSION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.NOT_FOUND:
        return 'The requested resource could not be found.';
      case ErrorCategory.CONVERSION:
        return 'Currency conversion failed. Please check the currency codes and try again.';
      case ErrorCategory.NETWORK:
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
  
  /**
   * Creates a detailed error report for logging
   * @returns Structured error data for logging
   */
  public toLogFormat(): Record<string, unknown> {
    const logData: Record<string, unknown> = {
      name: this.name,
      message: this.message,
      category: this.category,
      stack: this.stack,
      timestamp: formatDateISO(nowUTC())
    };
    
    if (this.statusCode) {
      logData.statusCode = this.statusCode;
    }
    
    if (this.context) {
      logData.context = this.context;
    }
    
    if (this.originalError) {
      if (this.originalError instanceof Error) {
        logData.originalError = {
          name: this.originalError.name,
          message: this.originalError.message,
          stack: this.originalError.stack
        };
      } else {
        logData.originalError = String(this.originalError);
      }
    }
    
    return logData;
  }
}

/**
 * Factory functions for creating different types of errors
 */
export const ErrorFactory = {
  /**
   * Creates an API error for problems with external API calls
   */
  createApiError: (
    message: string,
    originalError?: Error | unknown,
    statusCode?: number,
    context?: Record<string, unknown>
  ): AppError => {
    return new AppError(
      message,
      ErrorCategory.API,
      originalError,
      statusCode,
      context
    );
  },
  
  /**
   * Creates a conversion error for problems with currency conversion
   */
  createConversionError: (
    message: string,
    originalError?: Error | unknown,
    context?: Record<string, unknown>
  ): AppError => {
    return new AppError(
      message,
      ErrorCategory.CONVERSION,
      originalError,
      undefined,
      context
    );
  },
  
  /**
   * Creates a validation error for invalid input data
   */
  createValidationError: (
    message: string,
    context?: Record<string, unknown>
  ): AppError => {
    return new AppError(
      message,
      ErrorCategory.VALIDATION,
      undefined,
      400,
      context
    );
  },
  
  /**
   * Creates a not found error when a resource doesn't exist
   */
  createNotFoundError: (
    message: string,
    context?: Record<string, unknown>
  ): AppError => {
    return new AppError(
      message,
      ErrorCategory.NOT_FOUND,
      undefined,
      404,
      context
    );
  },
  
  /**
   * Creates a network error for connectivity issues
   */
  createNetworkError: (
    message: string,
    originalError?: Error | unknown,
    context?: Record<string, unknown>
  ): AppError => {
    return new AppError(
      message,
      ErrorCategory.NETWORK,
      originalError,
      undefined,
      context
    );
  }
};

/**
 * Centralized error logging function
 * @param error The error to log
 * @param additionalInfo Additional information to include in the log
 */
export function logError(
  error: Error | AppError | unknown,
  additionalInfo?: Record<string, unknown>
): void {
  let logData: Record<string, unknown>;
  
  if (error instanceof AppError) {
    logData = error.toLogFormat();
  } else if (error instanceof Error) {
    logData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      category: ErrorCategory.UNKNOWN,
      timestamp: formatDateISO(nowUTC())
    };
  } else {
    logData = {
      message: String(error),
      category: ErrorCategory.UNKNOWN,
      timestamp: formatDateISO(nowUTC())
    };
  }
  
  if (additionalInfo) {
    logData.additionalInfo = additionalInfo;
  }
  
  // Log to console for now - in a real app, you might send to a
  // logging service or error monitoring tool
  console.error('Error:', JSON.stringify(logData, null, 2));
} 