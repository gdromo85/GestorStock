import type { Response } from "express";

interface SuccessResponse<T> {
  status: "success";
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  status: "success";
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ErrorResponse {
  status: "error";
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
): void {
  const body: SuccessResponse<T> = { status: "success", data, message };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
): void {
  const body: PaginatedResponse<T> = {
    status: "success",
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
  res.json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: Array<{ field: string; message: string }>,
): void {
  const body: ErrorResponse = { status: "error", message };
  if (details) body.details = details;
  res.status(statusCode).json(body);
}
