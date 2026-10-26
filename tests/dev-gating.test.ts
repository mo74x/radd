import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isDevRouteAllowed } from '../src/lib/dev/gate';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';

describe('Developer Routes Production Gating & SEO Isolation', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore original NODE_ENV after each test
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  describe('isDevRouteAllowed()', () => {
    it('allows dev routes in development or test environments', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      assert.equal(isDevRouteAllowed(), true);

      (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
      assert.equal(isDevRouteAllowed(), true);
    });

    it('strictly forbids dev routes when NODE_ENV is production', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      assert.equal(isDevRouteAllowed(), false);
    });
  });

  describe('robots.txt & sitemap.xml Exclusions', () => {
    it('disallows /dev/ and private endpoints in robots configuration', () => {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules[0]
        : robotsConfig.rules;

      assert.ok(rules, 'Robots rules must be defined');
      assert.ok(Array.isArray(rules?.disallow), 'Disallow list must be an array');
      assert.ok(
        rules.disallow.includes('/dev/'),
        'Robots disallow list must contain /dev/'
      );
      assert.ok(
        rules.disallow.includes('/api/'),
        'Robots disallow list must contain /api/'
      );
      assert.ok(
        rules.disallow.includes('/approve/'),
        'Robots disallow list must contain /approve/'
      );
    });

    it('excludes /dev routes from sitemap entries', () => {
      const sitemapEntries = sitemap();
      assert.ok(Array.isArray(sitemapEntries), 'Sitemap entries must be an array');
      assert.ok(sitemapEntries.length > 0, 'Sitemap must contain public pages');

      for (const entry of sitemapEntries) {
        assert.equal(
          entry.url.includes('/dev'),
          false,
          `Sitemap must not contain /dev routes, found: ${entry.url}`
        );
      }
    });
  });
});
