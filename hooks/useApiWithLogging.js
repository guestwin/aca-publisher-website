import { useState, useCallback } from 'react';
// import clientLogger from '../lib/clientLogger'; // Temporarily disabled

// Custom hook for API calls with automatic logging
export const useApiWithLogging = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (url, options = {}) => {
    const startTime = performance.now();
    const method = options.method || 'GET';
    
    setLoading(true);
    setError(null);

    // Log API call start
    // clientLogger.info('API Call Start', {
    //   method,
    //   url,
    //   timestamp: Date.now()
    // });

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const duration = performance.now() - startTime;
      const status = response.status;

      // Log API response
      // clientLogger.apiCall(method, url, status, duration, {
      //   success: response.ok,
      //   statusText: response.statusText
      // });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP ${status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.message || `Request failed with status ${status}`);
      }

      const data = await response.json();
      
      // Log successful response data (without sensitive info)
      // clientLogger.info('API Call Success', {
      //   method,
      //   url,
      //   status,
      //   duration,
      //   dataSize: JSON.stringify(data).length
      // });

      return data;

    } catch (err) {
      const duration = performance.now() - startTime;
      
      // Log API error
      // clientLogger.error('API Call Failed', err, {
      //   method,
      //   url,
      //   duration,
      //   timestamp: Date.now()
      // });

      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
};

// Hook for specific HTTP methods
export const useApi = () => {
  const { apiCall, loading, error } = useApiWithLogging();

  const get = useCallback((url, options = {}) => {
    return apiCall(url, { ...options, method: 'GET' });
  }, [apiCall]);

  const post = useCallback((url, data, options = {}) => {
    return apiCall(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  const put = useCallback((url, data, options = {}) => {
    return apiCall(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  const del = useCallback((url, options = {}) => {
    return apiCall(url, { ...options, method: 'DELETE' });
  }, [apiCall]);

  const patch = useCallback((url, data, options = {}) => {
    return apiCall(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  return {
    get,
    post,
    put,
    delete: del,
    patch,
    loading,
    error,
    apiCall
  };
};

// Hook for form submissions with logging
export const useFormWithLogging = (onSubmit, formName = 'Unknown Form') => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = useCallback(async (formData, event) => {
    const startTime = performance.now();
    
    setSubmitting(true);
    setSubmitError(null);

    // Log form submission start
    // clientLogger.userAction('form_submit_start', event?.target, {
    //   formName,
    //   timestamp: Date.now()
    // });

    try {
      const result = await onSubmit(formData, event);
      const duration = performance.now() - startTime;

      // Log successful form submission
      // clientLogger.userAction('form_submit_success', event?.target, {
      //   formName,
      //   duration,
      //   timestamp: Date.now()
      // });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Log form submission error
      // clientLogger.error('Form Submission Failed', error, {
      //   formName,
      //   duration,
      //   timestamp: Date.now()
      // });

      setSubmitError(error.message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, formName]);

  return {
    handleSubmit,
    submitting,
    submitError
  };
};

// Hook for user interaction logging
export const useUserInteraction = () => {
  const logClick = useCallback((element, action = 'click', data = {}) => {
    // clientLogger.userAction(action, element, {
    //   ...data,
    //   timestamp: Date.now()
    // });
  }, []);

  const logPageView = useCallback((page, data = {}) => {
    // clientLogger.info('Page View', {
    //   page,
    //   ...data,
    //   timestamp: Date.now(),
    //   referrer: document.referrer,
    //   url: window.location.href
    // });
  }, []);

  const logSearch = useCallback((query, results = null, data = {}) => {
    // clientLogger.userAction('search', null, {
    //   query,
    //   resultsCount: results?.length || null,
    //   ...data,
    //   timestamp: Date.now()
    // });
  }, []);

  const logPurchase = useCallback((items, total, data = {}) => {
    // clientLogger.userAction('purchase', null, {
    //   items: items.map(item => ({
    //     id: item.id,
    //     name: item.name,
    //     price: item.price,
    //     quantity: item.quantity
    //   })),
    //   total,
    //   ...data,
    //   timestamp: Date.now()
    // });
  }, []);

  return {
    logClick,
    logPageView,
    logSearch,
    logPurchase
  };
};

export default useApiWithLogging;