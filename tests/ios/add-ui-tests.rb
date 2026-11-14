require 'xcodeproj'
project_path = File.expand_path('../../ios/App/App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'App' }
test = project.new_target(:ui_test_bundle, 'ATEFunctionalTests', :ios, '15.0')
test.add_dependency(app)
reference = project.main_group.new_file(File.join(__dir__, 'ATEFunctionalTests.swift'))
test.source_build_phase.add_file_reference(reference)
test.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'io.github.willyros01.clearpage.functionaltests',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'TEST_TARGET_NAME' => 'App',
    'SWIFT_VERSION' => '5.0',
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'CODE_SIGNING_ALLOWED' => 'NO'
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_test_target(test)
scheme.set_launch_target(app)
scheme.save_as(project_path, 'ATEFunctional', true)
