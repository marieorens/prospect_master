const NodeCache = require('node-cache');

/**
 * Service de cache en mémoire pour optimiser les performances
 */
class CacheService {
  constructor() {
    // Cache principal avec TTL par défaut de 5 minutes
    this.cache = new NodeCache({ 
      stdTTL: 300,  // 5 minutes
      checkperiod: 60,  // Vérification toutes les 60 secondes
      useClones: false
    });

    // Cache long terme pour données statiques (1 heure)
    this.longTermCache = new NodeCache({ 
      stdTTL: 3600,  // 1 heure
      checkperiod: 300,  // Vérification toutes les 5 minutes
      useClones: false
    });

    // Cache court terme pour requêtes fréquentes (30 secondes)
    this.shortTermCache = new NodeCache({ 
      stdTTL: 30,  // 30 secondes
      checkperiod: 10,  // Vérification toutes les 10 secondes
      useClones: false
    });

    // Statistiques de cache
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0
    };
  }

  /**
   * Génère une clé de cache standardisée
   * @param {string} prefix - Préfixe pour identifier le type de données
   * @param {string|Object} identifier - Identifiant unique
   * @returns {string} Clé de cache
   */
  generateKey(prefix, identifier) {
    if (typeof identifier === 'object') {
      identifier = JSON.stringify(identifier);
    }
    return `${prefix}:${identifier}`;
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé de cache
   * @param {string} cacheType - Type de cache ('default', 'long', 'short')
   * @returns {*} Valeur cachée ou undefined
   */
  get(key, cacheType = 'default') {
    let cache = this.cache;
    if (cacheType === 'long') cache = this.longTermCache;
    if (cacheType === 'short') cache = this.shortTermCache;

    const value = cache.get(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      console.log(`Cache HIT: ${key}`);
      return value;
    } else {
      this.stats.misses++;
      console.log(`Cache MISS: ${key}`);
      return undefined;
    }
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé de cache
   * @param {*} value - Valeur à cacher
   * @param {number} ttl - TTL personnalisé en secondes (optionnel)
   * @param {string} cacheType - Type de cache ('default', 'long', 'short')
   * @returns {boolean} Succès de l'opération
   */
  set(key, value, ttl = null, cacheType = 'default') {
    let cache = this.cache;
    if (cacheType === 'long') cache = this.longTermCache;
    if (cacheType === 'short') cache = this.shortTermCache;

    const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
    
    if (success) {
      this.stats.writes++;
      console.log(`Cache SET: ${key} (TTL: ${ttl || 'default'})`);
    }
    
    return success;
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - Clé de cache
   * @param {string} cacheType - Type de cache
   * @returns {number} Nombre d'éléments supprimés
   */
  delete(key, cacheType = 'default') {
    let cache = this.cache;
    if (cacheType === 'long') cache = this.longTermCache;
    if (cacheType === 'short') cache = this.shortTermCache;

    const deleted = cache.del(key);
    if (deleted > 0) {
      this.stats.deletes++;
      console.log(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Supprime toutes les clés correspondant à un pattern
   * @param {string} pattern - Pattern de recherche (supporte *)
   * @param {string} cacheType - Type de cache
   * @returns {number} Nombre d'éléments supprimés
   */
  deleteByPattern(pattern, cacheType = 'default') {
    let cache = this.cache;
    if (cacheType === 'long') cache = this.longTermCache;
    if (cacheType === 'short') cache = this.shortTermCache;

    const keys = cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchingKeys = keys.filter(key => regex.test(key));
    
    if (matchingKeys.length > 0) {
      const deleted = cache.del(matchingKeys);
      this.stats.deletes += deleted;
      console.log(`Cache DELETE PATTERN: ${pattern} (${deleted} keys)`);
      return deleted;
    }
    
    return 0;
  }

  /**
   * Wrapper pour exécuter une fonction avec cache automatique
   * @param {string} key - Clé de cache
   * @param {Function} fn - Fonction à exécuter si pas de cache
   * @param {Object} options - Options de cache
   * @returns {Promise} Résultat de la fonction ou cache
   */
  async wrap(key, fn, options = {}) {
    const {
      ttl = null,
      cacheType = 'default',
      refreshCache = false
    } = options;

    // Si refresh forcé, on supprime le cache existant
    if (refreshCache) {
      this.delete(key, cacheType);
    }

    // Vérifier le cache
    const cached = this.get(key, cacheType);
    if (cached !== undefined) {
      return cached;
    }

    // Exécuter la fonction et cacher le résultat
    try {
      const result = await fn();
      this.set(key, result, ttl, cacheType);
      return result;
    } catch (error) {
      console.error(`Error in cache wrap for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Méthodes spécialisées pour différents types de données
   */

  // Cache pour analytics
  async getAnalyticsCache(campaignId, period = '7d') {
    const key = this.generateKey('analytics', `${campaignId}:${period}`);
    return this.get(key, 'default');
  }

  setAnalyticsCache(campaignId, data, period = '7d') {
    const key = this.generateKey('analytics', `${campaignId}:${period}`);
    return this.set(key, data, 300, 'default'); // 5 minutes
  }

  // Cache pour domaines scraping
  async getDomainCache(domain) {
    const key = this.generateKey('domain', domain);
    return this.get(key, 'long');
  }

  setDomainCache(domain, data) {
    const key = this.generateKey('domain', domain);
    return this.set(key, data, 3600, 'long'); // 1 heure
  }

  // Cache pour templates
  async getTemplateCache() {
    const key = this.generateKey('templates', 'all');
    return this.get(key, 'default');
  }

  setTemplateCache(data) {
    const key = this.generateKey('templates', 'all');
    return this.set(key, data, 600, 'default'); // 10 minutes
  }

  // Invalidation sélective
  invalidateAnalytics(campaignId = null) {
    if (campaignId) {
      this.deleteByPattern(`analytics:${campaignId}:*`);
    } else {
      this.deleteByPattern('analytics:*');
    }
  }

  invalidateDomains() {
    this.deleteByPattern('domain:*', 'long');
  }

  invalidateTemplates() {
    this.deleteByPattern('templates:*');
  }

  /**
   * Statistiques et monitoring
   */
  getStats() {
    return {
      ...this.stats,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      cacheInfo: {
        default: {
          keys: this.cache.keys().length,
          stats: this.cache.getStats()
        },
        long: {
          keys: this.longTermCache.keys().length,
          stats: this.longTermCache.getStats()
        },
        short: {
          keys: this.shortTermCache.keys().length,
          stats: this.shortTermCache.getStats()
        }
      }
    };
  }

  /**
   * Nettoyage manuel
   */
  flush(cacheType = null) {
    if (cacheType === 'long') {
      this.longTermCache.flushAll();
    } else if (cacheType === 'short') {
      this.shortTermCache.flushAll();
    } else if (cacheType === 'default') {
      this.cache.flushAll();
    } else {
      // Nettoie tous les caches
      this.cache.flushAll();
      this.longTermCache.flushAll();
      this.shortTermCache.flushAll();
    }
    
    console.log(`Cache flushed: ${cacheType || 'all'}`);
  }
}

// Instance singleton
const cacheService = new CacheService();

module.exports = cacheService;
