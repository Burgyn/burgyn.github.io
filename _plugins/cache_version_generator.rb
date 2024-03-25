module Jekyll
    class CacheVersionGenerator < Generator
      priority :highest
  
      def generate(site)
        site.config['cache_version'] = Time.now.utc.strftime('%Y%m%d%H%M%S')
      end
    end
  end
  