import type { Request, Response, NextFunction, Errback } from "express";

//general error 500
const HandleError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: err.message || "somethinh went wrong",
  });
};

//wrong path error
const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
};

export { HandleError, notFound };
