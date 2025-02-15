/**
 * Composes multiple resolver wrappers into a single wrapper.
 * The wrappers are applied from right to left, so that the first wrapper
 * in the list is applied last.
 *
 * Example usage:
 *
 * const wrappedResolver = composeResolvers(
 *   withErrorHandlingCurried({ defaultErrorCode: "SOME_ERROR", defaultErrorMessage: "Default error message" }),
 *   withValidationCurried(validationSchema)
 * )(originalResolver);
 *
 * @param  {...Function} wrappers - Wrapper functions.
 * @returns {Function} - A function that takes a resolver and returns the wrapped resolver.
 */
const composeResolvers =
  (...wrappers) =>
  (resolver) =>
    wrappers.reduceRight((acc, wrapper) => wrapper(acc), resolver);

module.exports = composeResolvers;
