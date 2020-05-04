pipeline {
    agent { 
        docker { 
            image 'argo.registry:5000/epel-7-mgo' 
            args '-u jenkins:jenkins'
        }
    }
    options {
        checkoutToSubdirectory('rciam-service-registry')
        newContainerPerStage()
    }
    environment {
        PROJECT_DIR='rciam-service-registry'
    }
    stages {
        stage('Test Backend') {
            steps {
                echo 'Build...'
                sh """
                    cd ${WORKSPACE}/${PROJECT_DIR}/registry-backend-express
                    npm install 
                    npm test
                """
            }
        }
    }
    post{
        always {
            cleanWs()
        }
    }
}