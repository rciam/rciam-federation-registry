pipeline {
    agent any
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
                    cd ${WORKSPACE}/${PROJECT_DIR}/docker
                    docker-compose run node
                """
            }
            post{
                always {
                    sh "docker-compose down"
                }
            }
        }
    }
    post{
        always {
            cleanWs()
        }
    }
}
