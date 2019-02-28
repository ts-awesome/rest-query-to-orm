import { Request, Response } from 'express';

export type IMiddlewareFunction = (req: Request, res: Response) => Promise<void>;