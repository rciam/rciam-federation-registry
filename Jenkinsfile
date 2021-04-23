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
        stage('Build front-end') {
            agent {
                docker {
                    image 'node'
                }
            }
            steps {
                echo 'Build...'
                sh """
                    cd ${WORKSPACE}/${PROJECT_DIR}/federation-registry-frontend
                    npm install
                    npm run build
                """
            }
        }
    }
    post{
        success {
            script{
                if ( env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'devel' ) {
                    slackSend( channel: "aai-federation-registry", message: ":rocket: New version for <$BUILD_URL|$PROJECT_DIR>:$BRANCH_NAME Job: $JOB_NAME !")
                }
            }
        }
        failure {
            script{
                if ( env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'devel' ) {
                    slackSend( channel: "aai-federation-registry", message: ":rain_cloud: Build Failed for <$BUILD_URL|$PROJECT_DIR>:$BRANCH_NAME Job: $JOB_NAME")
                }
            }
        }
    }
}
