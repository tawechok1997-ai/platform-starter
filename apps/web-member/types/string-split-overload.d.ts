export {};

declare global {
  interface String {
    /** JavaScript String#split always returns at least one item for a literal separator. */
    split(separator: '.', limit?: number): [string, ...string[]];
  }
}
