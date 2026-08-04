/** Error carrying an HTTP status, so route handlers can map it to a response. */
export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
