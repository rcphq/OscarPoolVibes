import "@testing-library/jest-dom/vitest";
import "jest-axe";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
