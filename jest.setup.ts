// Location: /jest.setup.ts
// This file runs before every single test.

// This import gives Jest access to extra "matchers" like:
// .toBeInTheDocument()
// .toHaveValue()
// .toBeDisabled()
// etc.
import '@testing-library/jest-dom';

Element.prototype.scrollIntoView = () => { };

