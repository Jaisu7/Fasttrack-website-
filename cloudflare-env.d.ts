declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ENQUIRY_REVIEWERS?: string;
  }
}
