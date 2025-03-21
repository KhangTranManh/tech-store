FROM nginx:alpine

# Clean the default nginx html directory
RUN rm -rf /usr/share/nginx/html/*

# Copy all HTML files to the root
COPY frontend/views/*.html /usr/share/nginx/html/

# Copy CSS files
COPY frontend/css/ /usr/share/nginx/html/css/

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80