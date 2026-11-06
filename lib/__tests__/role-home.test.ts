import { describe, it, expect } from 'vitest';
import { getRoleHomeHref } from '../constants';

describe('getRoleHomeHref', () => {
  it('routes admins to the admin area', () => {
    expect(getRoleHomeHref('admin')).toBe('/admin');
  });

  it('routes sellers to the seller area', () => {
    expect(getRoleHomeHref('seller')).toBe('/seller');
  });

  it('routes buyers and unknown/missing roles to the buyer dashboard', () => {
    expect(getRoleHomeHref('customer')).toBe('/dashboard');
    expect(getRoleHomeHref(undefined)).toBe('/dashboard');
    expect(getRoleHomeHref(null)).toBe('/dashboard');
    expect(getRoleHomeHref('')).toBe('/dashboard');
  });
});
