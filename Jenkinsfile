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
                sh """
                    cd "${WORKSPACE}/${PROJECT_DIR}/docker"
                    docker-compose -p fr-test-${env.BUILD_TAG.toLowerCase().replaceAll('[^a-z0-9_-]', '-')} run --rm node
                """
            }
            post{
                always {
                    sh """
                        cd "${WORKSPACE}/${PROJECT_DIR}/docker"
                        docker-compose -p fr-test-${env.BUILD_TAG.toLowerCase().replaceAll('[^a-z0-9_-]', '-')} down --volumes --remove-orphans
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
