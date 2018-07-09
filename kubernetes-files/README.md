
This folder contains the deployment process for Happynodes project for integration pipeline.

# Usage

> integration/production
> > lego - This folder contains the kubernetes files for Kube-Lego Certificates managers for managing Let's Encrypt Certificates. Please follow the instruciton inside the Readme file. (Set up RBAC properly using `kubectl create clusterrolebinding dev-cluster-admin-binding --clusterrole=cluster-admin --user=xx@gmail.com` https://github.com/jetstack/kube-lego/issues/225)

> > collector - deployment script and kubernetes config files for the SQL updating scripts. Update the version number inside `push_collector_gcp.sh` and run `./push_collector_gcp.sh` to upload the container images. Once the images are pushed to GCP, deployed the containers using `kubectl apply -f neo-monitor-collector.yaml`

> > redis - deployment script and kubernetes config files for the redis updating scripts. Update the version number inside `push_redis_gcp.sh` and run `./push_redis_gcp.sh` to upload the container images. Once the images are pushed to GCP, deployed the containers using `kubectl apply -f neo-monitor-redis.yaml`

> > monitor - deployment script and kubernetes config files for the frontend and backend. Update the version number inside `push_monitor_gcp.sh` and run `./push_monitor_gcp.sh` to upload the container images. Once the images are pushed to GCP, deployed the containers using `kubectl apply -f neo-monitor.yaml`