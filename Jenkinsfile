pipeline {
    agent any
    options {
        checkoutToSubdirectory('rciam-federation-registry')
        newContainerPerStage()
    }
    environment {
        PROJECT_DIR='rciam-federation-registry'
    }
    stages {
        stage('Test Backend') {
            steps {
                echo 'Build...'
                withCredentials([file(credentialsId: 'setup_db', variable: 'SETUP_DB_FILE')]) {
                    sh """
                        cd ${WORKSPACE}/${PROJECT_DIR}/docker
                        cp $SETUP_DB_FILE ./setup_db.sql
                        docker-compose run node
                    """
                }
            }
            post{
                always {
                    sh """
                        cd ${WORKSPACE}/${PROJECT_DIR}/docker
                        docker-compose down
                    """
                    cleanWs()
                }
            }
        }
    }
}
